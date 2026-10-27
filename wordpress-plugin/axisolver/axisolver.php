<?php
/**
 * Plugin Name:       AxiSolver — Assistant IA pour votre site
 * Plugin URI:        https://axisolver.app
 * Description:       Installe AxiSolver, l'assistant IA d'Ataraxis qui résout les problèmes de vos visiteurs 24h/24. Collez votre site_id, c'est en ligne.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Ataraxis
 * Author URI:        https://ataraxis.group
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       axisolver
 * Domain Path:       /languages
 *
 * @package AxiSolver
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AXISOLVER_VERSION', '1.0.0' );
define( 'AXISOLVER_OPTION_SITE_ID', 'axisolver_site_id' );
define( 'AXISOLVER_OPTION_ACTIF', 'axisolver_actif' );
define( 'AXISOLVER_LOADER_URL', 'https://axisolver.app/v1.js' );

/**
 * Hook principal : injecte le loader AxiSolver dans le pied de page de
 * toutes les pages si le site_id est renseigné et le widget actif.
 */
function axisolver_injecter_loader() {
	$site_id = trim( (string) get_option( AXISOLVER_OPTION_SITE_ID, '' ) );
	$actif   = get_option( AXISOLVER_OPTION_ACTIF, '1' );

	if ( empty( $site_id ) || '1' !== $actif ) {
		return;
	}

	$site_id_safe = esc_attr( $site_id );
	$loader_url   = esc_url( AXISOLVER_LOADER_URL );

	echo "\n<!-- AxiSolver loader (plugin " . esc_html( AXISOLVER_VERSION ) . ") -->\n";
	echo '<script src="' . $loader_url . '" data-site-id="' . $site_id_safe . '" async></script>' . "\n";
}
add_action( 'wp_footer', 'axisolver_injecter_loader', 100 );

/**
 * Ajoute le menu « AxiSolver » sous Réglages dans l'admin WP.
 */
function axisolver_ajouter_menu() {
	add_options_page(
		__( 'AxiSolver', 'axisolver' ),
		__( 'AxiSolver', 'axisolver' ),
		'manage_options',
		'axisolver',
		'axisolver_rendre_page_reglages'
	);
}
add_action( 'admin_menu', 'axisolver_ajouter_menu' );

/**
 * Enregistre les options et leurs sanitize callbacks.
 */
function axisolver_enregistrer_options() {
	register_setting(
		'axisolver_reglages',
		AXISOLVER_OPTION_SITE_ID,
		array(
			'type'              => 'string',
			'sanitize_callback' => 'axisolver_sanitize_site_id',
			'default'           => '',
		)
	);
	register_setting(
		'axisolver_reglages',
		AXISOLVER_OPTION_ACTIF,
		array(
			'type'              => 'string',
			'sanitize_callback' => 'axisolver_sanitize_actif',
			'default'           => '1',
		)
	);
}
add_action( 'admin_init', 'axisolver_enregistrer_options' );

/**
 * Sanitize du site_id : lettres, chiffres, tirets, longueur raisonnable.
 */
function axisolver_sanitize_site_id( $input ) {
	$input = is_scalar( $input ) ? (string) $input : '';
	$input = trim( $input );
	$input = preg_replace( '/[^a-zA-Z0-9_-]/', '', $input );
	if ( strlen( $input ) > 64 ) {
		$input = substr( $input, 0, 64 );
	}
	return $input;
}

function axisolver_sanitize_actif( $input ) {
	return ( '1' === (string) $input ) ? '1' : '0';
}

/**
 * Rendu de la page de réglages.
 */
function axisolver_rendre_page_reglages() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$site_id = get_option( AXISOLVER_OPTION_SITE_ID, '' );
	$actif   = get_option( AXISOLVER_OPTION_ACTIF, '1' );
	?>
	<div class="wrap">
		<h1>
			<span style="display:inline-flex;align-items:center;vertical-align:middle;background:linear-gradient(135deg,#4f46e5,#8b5cf6);color:#fff;width:28px;height:28px;border-radius:8px;justify-content:center;font-weight:800;font-size:14px;margin-right:8px;">A</span>
			AxiSolver
		</h1>
		<p style="font-size:14px;color:#50575e;max-width:720px;">
			<?php esc_html_e( "Collez votre identifiant de site AxiSolver ci-dessous. Dès que vous enregistrez, le widget s'affichera sur toutes les pages de votre site en bas à droite.", 'axisolver' ); ?>
		</p>

		<form method="post" action="options.php">
			<?php settings_fields( 'axisolver_reglages' ); ?>
			<?php do_settings_sections( 'axisolver_reglages' ); ?>

			<table class="form-table" role="presentation">
				<tbody>
				<tr>
					<th scope="row">
						<label for="axisolver_site_id"><?php esc_html_e( 'Identifiant du site (site_id)', 'axisolver' ); ?></label>
					</th>
					<td>
						<input
							type="text"
							id="axisolver_site_id"
							name="<?php echo esc_attr( AXISOLVER_OPTION_SITE_ID ); ?>"
							value="<?php echo esc_attr( $site_id ); ?>"
							class="regular-text"
							placeholder="monsite"
							maxlength="64"
							autocomplete="off"
						/>
						<p class="description">
							<?php
							printf(
								/* translators: %s: link to AxiSolver dashboard */
								esc_html__( "Vous trouverez votre site_id dans votre dashboard AxiSolver : %s", 'axisolver' ),
								'<a href="https://axisolver.app/dashboard" target="_blank" rel="noopener">axisolver.app/dashboard</a>'
							);
							?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<?php esc_html_e( "Afficher le widget", 'axisolver' ); ?>
					</th>
					<td>
						<label>
							<input
								type="checkbox"
								name="<?php echo esc_attr( AXISOLVER_OPTION_ACTIF ); ?>"
								value="1"
								<?php checked( '1', $actif ); ?>
							/>
							<?php esc_html_e( "Afficher AxiSolver sur toutes les pages publiques", 'axisolver' ); ?>
						</label>
						<p class="description">
							<?php esc_html_e( "Décochez pour masquer temporairement le widget sans supprimer le plugin.", 'axisolver' ); ?>
						</p>
					</td>
				</tr>
				</tbody>
			</table>

			<?php submit_button( __( 'Enregistrer', 'axisolver' ) ); ?>
		</form>

		<div style="margin-top:40px;padding:20px;background:#f6f7f7;border-radius:4px;border-left:4px solid #4f46e5;max-width:720px;">
			<h2 style="margin-top:0;"><?php esc_html_e( "Vous n'avez pas encore de compte AxiSolver ?", 'axisolver' ); ?></h2>
			<p>
				<?php esc_html_e( "AxiSolver est un assistant IA d'Ataraxis qui accueille vos visiteurs 24h/24, qualifie leurs demandes, et répond en citant les sources de votre site. Il remplace les chatbots classiques.", 'axisolver' ); ?>
			</p>
			<p>
				<a href="https://axisolver.app/inscription" target="_blank" rel="noopener" class="button button-primary">
					<?php esc_html_e( 'Créer un compte AxiSolver', 'axisolver' ); ?>
				</a>
				<a href="https://axisolver.app" target="_blank" rel="noopener" class="button" style="margin-left:8px;">
					<?php esc_html_e( 'En savoir plus', 'axisolver' ); ?>
				</a>
			</p>
		</div>

		<?php if ( ! empty( $site_id ) && '1' === $actif ) : ?>
		<div style="margin-top:24px;padding:16px;background:#edfaef;border-radius:4px;border-left:4px solid #46b450;max-width:720px;">
			<p style="margin:0;">
				<strong><?php esc_html_e( "Widget actif", 'axisolver' ); ?></strong> —
				<?php
				printf(
					/* translators: %s: site_id */
					esc_html__( "AxiSolver est en ligne avec l'identifiant %s.", 'axisolver' ),
					'<code>' . esc_html( $site_id ) . '</code>'
				);
				?>
				<?php esc_html_e( "Ouvrez votre site dans un onglet privé pour voir le cercle rayonnant apparaître en bas à droite.", 'axisolver' ); ?>
			</p>
		</div>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * Ajoute un lien « Réglages » sur la page des plugins installés.
 */
function axisolver_lien_reglages( $links ) {
	$url = admin_url( 'options-general.php?page=axisolver' );
	array_unshift(
		$links,
		'<a href="' . esc_url( $url ) . '">' . esc_html__( 'Réglages', 'axisolver' ) . '</a>'
	);
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'axisolver_lien_reglages' );
