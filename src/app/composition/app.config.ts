import { ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";
import { searchProviders } from "./search.providers";
export const appConfig: ApplicationConfig = {
  providers: [
    ...searchProviders,
    provideRouter([
      {
        path: "",
        loadComponent: () =>
          import("../features/search/pages/search-page.component").then(
            (m) => m.SearchPageComponent,
          ),
      },
      {
        path: "jurisprudencia",
        title: "Oráculo · Jurisprudência",
        loadComponent: () =>
          import("../features/jurisprudence/pages/jurisprudence-page.component").then(
            (m) => m.JurisprudencePageComponent,
          ),
      },
      {
        path: "jurimetria",
        loadComponent: () =>
          import("../features/jurimetry/pages/jurimetry-page.component").then(
            (m) => m.JurimetryPageComponent,
          ),
      },
      {
        path: "publicacoes/:id",
        loadComponent: () =>
          import("../features/publications/pages/publication-detail.page").then(
            (m) => m.PublicationDetailPage,
          ),
      },
      { path: "**", redirectTo: "" },
    ]),
  ],
};
