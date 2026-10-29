<?php
/**
 * Plugin Name:       AXI Security Shield
 * Plugin URI:        https://axisolver.app
 * Description:       Permet à AXI (AxiSolver / AxiHub) d'appliquer automatiquement les corrections de sécurité détectées lors des audits. Expose des endpoints REST custom sous /wp-json/axi-shield/v1/ pilotés uniquement via Application Password d'un utilisateur administrateur.
 * Version:           1.0.0
 * Requires at least: 5.6
 * Requires PHP:      7.4
 * Author:            Ataraxis Holding Ltd — AXI Security Shield
 * Author URI:        https://axisolver.app
 * License:           Proprietary
 * Text Domain:       axi-security-shield
 */

if (!defined('ABSPATH')) {
    exit;
}

define('AXI_SHIELD_VERSION', '1.0.0');
define('AXI_SHIELD_OPTION', 'axi_shield_config');

/**
 * Config par défaut. Chaque clé correspond à un code de recommandation
 * audité par AxiSolver. Valeurs stockées dans wp_options.
 */
function axi_shield_default_config() {
    return [
        // Headers HTTP (appliqués via send_headers)
        'hsts' => ['actif' => false, 'max_age' => 31536000, 'include_subdomains' => true, 'preload' => false],
        'x_frame_options' => ['actif' => false, 'valeur' => 'SAMEORIGIN'],
        'x_content_type_options' => ['actif' => false],
        'referrer_policy' => ['actif' => false, 'valeur' => 'strict-origin-when-cross-origin'],
        'permissions_policy' => ['actif' => false, 'valeur' => 'camera=(), microphone=(), geolocation=(self), payment=()'],
        'csp' => ['actif' => false, 'mode' => 'report-only', 'valeur' => "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"],

        // Contenu / CMS
        'masquer_version_cms' => ['actif' => false],
        'noopener_target_blank' => ['actif' => false],

        // Exposition
        'robots_txt_virtuel' => ['actif' => false, 'contenu' => "User-agent: *\nAllow: /\n"],
        'security_txt_virtuel' => [
            'actif' => false,
            'contact' => '',
            'expires' => '',
            'preferred_languages' => 'fr, en',
        ],

        // Réputation
        'force_https' => ['actif' => false],

        // Masquer X-Powered-By côté PHP si possible
        'masquer_x_powered_by' => ['actif' => false],
    ];
}

function axi_shield_get_config() {
    $defauts = axi_shield_default_config();
    $actuel = get_option(AXI_SHIELD_OPTION, []);
    if (!is_array($actuel)) {
        $actuel = [];
    }
    return array_replace_recursive($defauts, $actuel);
}

function axi_shield_save_config($nouveau) {
    $actuel = axi_shield_get_config();
    $fusionne = array_replace_recursive($actuel, $nouveau);
    update_option(AXI_SHIELD_OPTION, $fusionne, false);
    return $fusionne;
}

// ═══════════════════════════════════════════════════════════════════
// REMÉDIATIONS APPLIQUÉES AU RUNTIME
// ═══════════════════════════════════════════════════════════════════

/**
 * Envoie les en-têtes HTTP de sécurité activés dans la config.
 * Hook send_headers = juste avant que WP envoie la réponse.
 */
function axi_shield_apply_headers() {
    if (headers_sent()) return;
    $c = axi_shield_get_config();

    if (!empty($c['hsts']['actif']) && is_ssl()) {
        $parts = ['max-age=' . intval($c['hsts']['max_age'])];
        if (!empty($c['hsts']['include_subdomains'])) $parts[] = 'includeSubDomains';
        if (!empty($c['hsts']['preload'])) $parts[] = 'preload';
        header('Strict-Transport-Security: ' . implode('; ', $parts));
    }

    if (!empty($c['x_frame_options']['actif'])) {
        header('X-Frame-Options: ' . sanitize_text_field($c['x_frame_options']['valeur']));
    }

    if (!empty($c['x_content_type_options']['actif'])) {
        header('X-Content-Type-Options: nosniff');
    }

    if (!empty($c['referrer_policy']['actif'])) {
        header('Referrer-Policy: ' . sanitize_text_field($c['referrer_policy']['valeur']));
    }

    if (!empty($c['permissions_policy']['actif'])) {
        header('Permissions-Policy: ' . $c['permissions_policy']['valeur']);
    }

    if (!empty($c['csp']['actif'])) {
        $nom = $c['csp']['mode'] === 'enforce'
            ? 'Content-Security-Policy'
            : 'Content-Security-Policy-Report-Only';
        header($nom . ': ' . $c['csp']['valeur']);
    }

    if (!empty($c['masquer_x_powered_by']['actif'])) {
        header_remove('X-Powered-By');
    }
}
add_action('send_headers', 'axi_shield_apply_headers', 1);

/**
 * Masque la version WordPress exposée dans le HTML.
 */
function axi_shield_mask_generator() {
    $c = axi_shield_get_config();
    if (!empty($c['masquer_version_cms']['actif'])) {
        remove_action('wp_head', 'wp_generator');
        add_filter('the_generator', '__return_empty_string');
    }
}
add_action('init', 'axi_shield_mask_generator');

/**
 * Ajoute rel="noopener noreferrer" à tous les liens target="_blank"
 * dans le contenu rendu.
 */
function axi_shield_noopener_filter($content) {
    $c = axi_shield_get_config();
    if (empty($c['noopener_target_blank']['actif'])) return $content;
    if (empty($content)) return $content;

    return preg_replace_callback(
        '/<a\s+([^>]*?)target\s*=\s*["\']_blank["\']([^>]*?)>/i',
        function ($m) {
            $attrs = $m[1] . ' target="_blank" ' . $m[2];
            if (stripos($attrs, 'rel=') === false) {
                return '<a ' . trim($attrs) . ' rel="noopener noreferrer">';
            }
            // rel existe mais sans noopener : on l'ajoute
            $attrs = preg_replace_callback(
                '/rel\s*=\s*["\']([^"\']*)["\']/i',
                function ($r) {
                    $vals = preg_split('/\s+/', trim($r[1]));
                    if (!in_array('noopener', $vals)) $vals[] = 'noopener';
                    if (!in_array('noreferrer', $vals)) $vals[] = 'noreferrer';
                    return 'rel="' . implode(' ', array_filter($vals)) . '"';
                },
                $attrs
            );
            return '<a ' . trim($attrs) . '>';
        },
        $content
    );
}
add_filter('the_content', 'axi_shield_noopener_filter', 99);

/**
 * robots.txt virtuel géré par le plugin.
 */
function axi_shield_robots_filter($output, $public) {
    $c = axi_shield_get_config();
    if (empty($c['robots_txt_virtuel']['actif'])) return $output;
    return $c['robots_txt_virtuel']['contenu'] . "\nSitemap: " . home_url('/sitemap.xml') . "\n";
}
add_filter('robots_txt', 'axi_shield_robots_filter', 10, 2);

/**
 * /.well-known/security.txt virtuel.
 */
function axi_shield_security_txt() {
    $c = axi_shield_get_config();
    if (empty($c['security_txt_virtuel']['actif'])) return;
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($uri, '/.well-known/security.txt') !== 0) return;
    $sec = $c['security_txt_virtuel'];
    $contact = sanitize_email($sec['contact']);
    if (!$contact) $contact = get_option('admin_email');
    $expires = $sec['expires'] ?: gmdate('Y-m-d\TH:i:s\Z', time() + 365 * 24 * 3600);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Contact: mailto:" . $contact . "\n";
    echo "Expires: " . $expires . "\n";
    echo "Preferred-Languages: " . sanitize_text_field($sec['preferred_languages']) . "\n";
    echo "Canonical: " . home_url('/.well-known/security.txt') . "\n";
    exit;
}
add_action('init', 'axi_shield_security_txt', 1);

/**
 * Force la redirection HTTP → HTTPS.
 */
function axi_shield_force_https() {
    $c = axi_shield_get_config();
    if (empty($c['force_https']['actif'])) return;
    if (is_ssl()) return;
    if (defined('DOING_AJAX') || defined('REST_REQUEST')) return;
    $url = 'https://' . ($_SERVER['HTTP_HOST'] ?? '') . ($_SERVER['REQUEST_URI'] ?? '');
    wp_redirect($url, 301);
    exit;
}
add_action('template_redirect', 'axi_shield_force_https', 1);

// ═══════════════════════════════════════════════════════════════════
// ENDPOINTS REST CUSTOM
// ═══════════════════════════════════════════════════════════════════

function axi_shield_can_manage() {
    return current_user_can('manage_options');
}

function axi_shield_register_rest() {
    $ns = 'axi-shield/v1';

    register_rest_route($ns, '/status', [
        'methods'  => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function () {
            return [
                'installed' => true,
                'version'   => AXI_SHIELD_VERSION,
                'wp_version' => get_bloginfo('version'),
                'is_ssl'    => is_ssl(),
                'home_url'  => home_url(),
            ];
        },
    ]);

    register_rest_route($ns, '/config', [
        'methods'  => 'GET',
        'permission_callback' => 'axi_shield_can_manage',
        'callback' => function () {
            return axi_shield_get_config();
        },
    ]);

    register_rest_route($ns, '/apply/(?P<code>[a-z0-9_]+)', [
        'methods'  => 'POST',
        'permission_callback' => 'axi_shield_can_manage',
        'args' => [
            'code' => ['required' => true, 'type' => 'string'],
        ],
        'callback' => function (WP_REST_Request $req) {
            $code = sanitize_key($req['code']);
            $params = $req->get_json_params() ?: [];
            return axi_shield_apply_remediation($code, $params);
        },
    ]);

    register_rest_route($ns, '/revoke/(?P<code>[a-z0-9_]+)', [
        'methods'  => 'POST',
        'permission_callback' => 'axi_shield_can_manage',
        'args' => [
            'code' => ['required' => true, 'type' => 'string'],
        ],
        'callback' => function (WP_REST_Request $req) {
            $code = sanitize_key($req['code']);
            return axi_shield_revoke_remediation($code);
        },
    ]);
}
add_action('rest_api_init', 'axi_shield_register_rest');

/**
 * Mapping code finding → clé config + handler custom éventuel.
 */
function axi_shield_apply_remediation($code, $params = []) {
    $resultat = [
        'code' => $code,
        'applique' => false,
        'journal' => '',
    ];

    switch ($code) {
        case 'hsts_absent':
        case 'hsts_max_age_court':
        case 'hsts_sans_subdomains':
            axi_shield_save_config(['hsts' => [
                'actif' => true,
                'max_age' => intval($params['max_age'] ?? 31536000),
                'include_subdomains' => (bool)($params['include_subdomains'] ?? true),
                'preload' => (bool)($params['preload'] ?? false),
            ]]);
            $resultat['applique'] = true;
            $resultat['journal'] = 'HSTS activé (max-age=1an, includeSubDomains).';
            break;

        case 'x_frame_options_absent':
        case 'x_frame_options_mal_configure':
            axi_shield_save_config(['x_frame_options' => [
                'actif' => true,
                'valeur' => sanitize_text_field($params['valeur'] ?? 'SAMEORIGIN'),
            ]]);
            $resultat['applique'] = true;
            $resultat['journal'] = 'X-Frame-Options: SAMEORIGIN envoyé sur toutes les réponses.';
            break;

        case 'x_content_type_options_absent':
            axi_shield_save_config(['x_content_type_options' => ['actif' => true]]);
            $resultat['applique'] = true;
            $resultat['journal'] = 'X-Content-Type-Options: nosniff activé.';
            break;

        case 'referrer_policy_absent':
        case 'referrer_policy_faible':
            axi_shield_save_config(['referrer_policy' => [
                'actif' => true,
                'valeur' => sanitize_text_field($params['valeur'] ?? 'strict-origin-when-cross-origin'),
            ]]);
            $resultat['applique'] = true;
            $resultat['journal'] = 'Referrer-Policy appliquée (strict-origin-when-cross-origin).';
            break;

        case 'permissions_policy_absent':
            axi_shield_save_config(['permissions_policy' => [
                'actif' => true,
                'valeur' => $params['valeur'] ?? 'camera=(), microphone=(), geolocation=(self), payment=()',
            ]]);
            $resultat['applique'] = true;
            $resultat['journal'] = 'Permissions-Policy restrictive activée.';
            break;

        case 'csp_absent':
            axi_shield_save_config(['csp' => [
                'actif' => true,
                'mode' => 'report-only',
                'valeur' => $params['valeur'] ?? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
            ]]);
            $resultat['applique'] = true;
            $resultat['journal'] = 'CSP activée en mode report-only. Analyse les rapports avant passage en enforce.';
            break;

        case 'cms_version_exposee':
            axi_shield_save_config(['masquer_version_cms' => ['actif' => true]]);
            $resultat['applique'] = true;
            $resultat['journal'] = 'Balise meta generator masquée + filtre the_generator vidé.';
            break;

        case 'target_blank_sans_noopener':
            axi_shield_save_config(['noopener_target_blank' => ['actif' => true]]);
            $resultat['applique'] = true;
            $resultat['journal'] = 'Filtre the_content ajoute rel="noopener noreferrer" aux liens target="_blank".';
            break;

        case 'robots_txt_absent':
            axi_shield_save_config(['robots_txt_virtuel' => [
                'actif' => true,
                'contenu' => $params['contenu'] ?? "User-agent: *\nAllow: /\n",
            ]]);
            $resultat['applique'] = true;
            $resultat['journal'] = 'robots.txt virtuel servi avec Sitemap: ' . home_url('/sitemap.xml');
            break;

        case 'security_txt_absent':
            axi_shield_save_config(['security_txt_virtuel' => [
                'actif' => true,
                'contact' => sanitize_email($params['contact'] ?? get_option('admin_email')),
                'expires' => sanitize_text_field($params['expires'] ?? ''),
                'preferred_languages' => sanitize_text_field($params['preferred_languages'] ?? 'fr, en'),
            ]]);
            $resultat['applique'] = true;
            $resultat['journal'] = '/.well-known/security.txt servi dynamiquement.';
            break;

        case 'https_non_force':
        case 'redirect_http_vers_http':
        case 'http_sert_contenu':
            axi_shield_save_config(['force_https' => ['actif' => true]]);
            $resultat['applique'] = true;
            $resultat['journal'] = 'Redirection HTTP → HTTPS forcée via template_redirect.';
            break;

        case 'x_powered_by_expose':
            axi_shield_save_config(['masquer_x_powered_by' => ['actif' => true]]);
            $resultat['applique'] = true;
            $resultat['journal'] = 'X-Powered-By retiré des réponses PHP.';
            break;

        default:
            $resultat['applique'] = false;
            $resultat['journal'] = 'Remédiation « ' . $code . ' » non prise en charge par ce plugin. Nécessite une action côté serveur (SSH / config Nginx) ou une version future du plugin.';
            break;
    }

    return $resultat;
}

/**
 * Désactive une remédiation précédemment appliquée.
 */
function axi_shield_revoke_remediation($code) {
    $map = [
        'hsts_absent' => 'hsts',
        'hsts_max_age_court' => 'hsts',
        'hsts_sans_subdomains' => 'hsts',
        'x_frame_options_absent' => 'x_frame_options',
        'x_frame_options_mal_configure' => 'x_frame_options',
        'x_content_type_options_absent' => 'x_content_type_options',
        'referrer_policy_absent' => 'referrer_policy',
        'referrer_policy_faible' => 'referrer_policy',
        'permissions_policy_absent' => 'permissions_policy',
        'csp_absent' => 'csp',
        'cms_version_exposee' => 'masquer_version_cms',
        'target_blank_sans_noopener' => 'noopener_target_blank',
        'robots_txt_absent' => 'robots_txt_virtuel',
        'security_txt_absent' => 'security_txt_virtuel',
        'https_non_force' => 'force_https',
        'redirect_http_vers_http' => 'force_https',
        'http_sert_contenu' => 'force_https',
        'x_powered_by_expose' => 'masquer_x_powered_by',
    ];

    if (!isset($map[$code])) {
        return ['code' => $code, 'revoque' => false, 'journal' => 'Code inconnu.'];
    }

    axi_shield_save_config([$map[$code] => ['actif' => false]]);
    return [
        'code' => $code,
        'revoque' => true,
        'journal' => 'Remédiation désactivée (option conservée en base, actif=false).',
    ];
}
