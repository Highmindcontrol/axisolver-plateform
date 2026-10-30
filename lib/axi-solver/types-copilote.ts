export type SiteCopilote = {
  slug: string;
  nomEntreprise: string;
  domainePrincipal: string;
};

export type ContexteCopiloteUser = {
  prenomUtilisateur: string | null;
  sites: SiteCopilote[];
};
