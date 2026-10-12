export interface paths {
    "/api/v1/publications/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["searchPublications"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publications/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["readPublication"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/search/facets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["searchFacets"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/jurimetry/query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["queryJurimetry"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/search/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getCapabilities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/search/sessions/close": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["closeSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["liveness"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["readiness"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/jurimetry/references/query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["queryReferenceJurimetry"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publications/{id}/related": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["recommendRelatedPublications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/publications/{id}/timeline/query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["queryPublicationTimeline"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ProcessFilter: {
            cnj: string;
            /** @enum {string} */
            relation: "any" | "publication_process" | "referenced";
        };
        Criteria: {
            q: string;
            /** @enum {string} */
            mode: "auto" | "lexical" | "phrase" | "cnj";
            courts: string[];
            documentTypes: string[];
            process: components["schemas"]["ProcessFilter"] | null;
            /** @enum {string} */
            dateAxis: "publication" | "availability" | "source";
            from: string | null;
            to: string | null;
            /** @enum {string} */
            missingDates: "include" | "exclude" | "only";
            /** @enum {string} */
            sort: "relevance" | "date_desc";
            /**
             * @description Publicidade do processo; a omissão é normalizada para both. Sempre intersectada com a população autorizada. Este acesso entrega somente publicações públicas/ativas; restricted retorna vazio e both não amplia autorização.
             * @enum {string}
             */
            visibility?: "public" | "restricted" | "both";
            /** @description Nome de parte destinatária: todos os termos no mesmo destinatário, sem buscar no corpo. */
            partyName?: string | null;
            /** @description Nome de advogado destinatário: todos os termos no mesmo advogado da OAB informada. */
            attorneyName?: string | null;
            /** @description Número de OAB exato após remover espaços, pontos, barras e hífens; preserva zeros e sufixos. */
            oabNumber?: string | null;
            /** @description UF da OAB, duas letras; exige número ou nome de advogado e correlaciona o mesmo registro. */
            oabState?: string | null;
            /**
             * @description Publicações com ementa própria projetada ou tipo decisório explícito na fonte. Unidade publicação, não precedentes únicos.
             * @constant
             */
            collection?: "jurisprudence";
            /**
             * @description Exige collection=jurisprudence. Omissão usa rerank, que exige sort=relevance. BM25 permite paginação completa; rerank limita a janela de candidatos declarada.
             * @enum {string}
             */
            ranking?: "bm25" | "rerank";
        };
        SearchRequest: {
            criteria: components["schemas"]["Criteria"];
            pageSize: number;
            cursor?: string | null;
        };
        FacetsRequest: {
            criteria: components["schemas"]["Criteria"];
            fields: ("court" | "documentType")[];
        };
        JurimetryRequest: {
            criteria: components["schemas"]["Criteria"];
            /** @enum {string} */
            metric: "publications" | "full_allowance";
            includeProposals: boolean;
        };
        Span: {
            start: number;
            end: number;
        };
        Snippet: {
            text: string;
            highlights: components["schemas"]["Span"][];
        };
        Summary: {
            id: string;
            revisionId: string;
            textVersionId: string;
            court: string | null;
            documentType: string | null;
            publicationDate: string | null;
            availabilityDate: string | null;
            sourceDate: string | null;
            processes: string[];
            snippets: components["schemas"]["Snippet"][];
            score: number | null;
            jurisprudence?: components["schemas"]["JurisprudencePreview"];
        };
        Total: {
            value: number;
            /** @enum {string} */
            relation: "eq" | "gte";
        };
        /** @enum {string} */
        Consistency: "projection_snapshot" | "pit_snapshot_revalidated_projection";
        SearchResponse: {
            items: components["schemas"]["Summary"][];
            total: components["schemas"]["Total"];
            nextCursor: string | null;
            sessionId: string | null;
            expiresAt: string | null;
            tookMs: number;
            strategy: string;
            /** @constant */
            strategyVersion: "1";
            consistency: components["schemas"]["Consistency"];
            warnings: string[];
            ranking?: components["schemas"]["SearchRanking"];
        };
        Bucket: {
            key: string;
            count: number;
        };
        Facet: {
            /** @enum {string} */
            field: "court" | "documentType" | "period";
            /** @constant */
            unit: "publication";
            buckets: components["schemas"]["Bucket"][];
            missing: number;
            truncated: boolean;
            approximate: boolean;
            countErrorUpperBound: number;
            sumOtherDocCount: number;
        };
        FacetsResponse: {
            facets: components["schemas"]["Facet"][];
            total: components["schemas"]["Total"];
            criteria: components["schemas"]["Criteria"];
            consistency: components["schemas"]["Consistency"];
            warnings: string[];
        };
        JurimetryResponse: {
            /** @constant */
            metric: "publications";
            /** @constant */
            metricVersion: "1";
            /** @constant */
            unit: "publication";
            /** @enum {string} */
            state: "ok" | "no_population";
            population: number;
            numerator: number | null;
            denominator: number;
            value: number | null;
            distributions: components["schemas"]["Facet"][];
            excludedMissingDates: number;
            /** @enum {string} */
            dateAxis: "publication" | "availability" | "source";
            /** @enum {string} */
            missingDates: "include" | "exclude" | "only";
            reviewPolicy: string;
            selectionPolicy: string;
            criteria: components["schemas"]["Criteria"];
            /** Format: date-time */
            observedAt: string;
            consistency: components["schemas"]["Consistency"];
            warnings: string[];
        };
        Evidence: {
            publicationId: string;
            revisionId: string;
            textVersionId: string;
            start: number;
            end: number;
            surface: string;
        };
        SelectedOutput: {
            id: string;
            /** @enum {string} */
            family: "act" | "decision_unit" | "classification";
            actId: string | null;
            actVersionId: string | null;
            label: string | null;
            /** @enum {string} */
            reviewStatus: "unreviewed" | "proposed" | "validated" | "rejected" | "needs_review";
            informationState: string;
            meritsState: string | null;
            meritsResult: string | null;
            evidence: components["schemas"]["Evidence"][];
        };
        Reference: {
            id: string;
            /** @enum {string} */
            family: "citation" | "normative";
            type: string;
            key: string;
            mentionRole: string | null;
            surface: string;
            attributionStatus: string;
            attributedEntity: string | null;
            resolutionStatus: string;
            legalStatus: string | null;
            /** @enum {string} */
            reviewStatus: "unreviewed" | "proposed" | "validated" | "rejected" | "needs_review";
            evidence: components["schemas"]["Evidence"][];
        };
        Source: {
            id: string;
            recordId: string;
            adapterId: string;
            adapterVersion: string;
            /** @enum {string} */
            schemaVersion: "1" | "2";
            projectionVersion: string;
            /** Format: date-time */
            observedAt: string;
            /** Format: date-time */
            ingestedAt: string;
            textSha256: string;
        };
        DetailResponse: {
            publication: components["schemas"]["Summary"];
            text: string;
            source: components["schemas"]["Source"];
            outputs: components["schemas"]["SelectedOutput"][];
            references: components["schemas"]["Reference"][];
            consistency: components["schemas"]["Consistency"];
            warnings: string[];
            metadata?: components["schemas"]["JudicialMetadata"];
        };
        Feature: {
            /** @enum {string} */
            name: "search" | "courtFilter" | "documentTypeFilter" | "publicationDate" | "availabilityDate" | "sourceDate" | "facets" | "publicationMetrics" | "acts" | "decisionUnits" | "classifications" | "citations" | "normativeReferences" | "decisionMetrics" | "exactProcessCount" | "ledgerAccess" | "frozenCorpus" | "partyNameFilter" | "attorneyNameFilter" | "oabFilter" | "jurisprudenceSearch";
            available: boolean;
            reason: string | null;
        };
        CapabilitiesResponse: {
            /** @constant */
            apiVersion: "1";
            /** @constant */
            strategyVersion: "1";
            /** Format: date-time */
            checkedAt: string;
            dataVersions: string[];
            features: components["schemas"]["Feature"][];
            /** @constant */
            accessGuarantee: "projection_revalidation";
            /** @constant */
            legacyPolicy: "explicit_public_active_only";
            warnings: string[];
        };
        ErrorResponse: {
            code: string;
            message: string;
            requestId: string;
            validation: {
                path: string;
                message: string;
            }[];
        };
        CloseSessionRequest: {
            sessionId: string;
        };
        CloseSessionResponse: {
            closed: boolean;
        };
        HealthResponse: {
            /** @enum {string} */
            status: "ok" | "unavailable";
        };
        /** @enum {string} */
        ReferenceFilter: "any" | "jurisprudential" | "normative" | "either" | "both";
        ReferencesJurimetryRequest: {
            criteria: components["schemas"]["Criteria"];
            references: components["schemas"]["ReferenceFilter"];
            includeProposals: boolean;
            pageSize: number;
            page: number;
        };
        ReferencePresence: {
            jurisprudentialOnly: number;
            normativeOnly: number;
            both: number;
            neither: number;
        };
        FrequentReference: {
            /** @enum {string} */
            family: "citation" | "normative";
            key: string;
            surface: string;
            publications: number;
            mentions: number;
        };
        ReferencesJurimetryResponse: {
            items: components["schemas"]["Summary"][];
            total: components["schemas"]["Total"];
            totalCandidates: number;
            population: number;
            page: number;
            pageSize: number;
            hasMore: boolean;
            presence: components["schemas"]["ReferencePresence"];
            topReferences: components["schemas"]["FrequentReference"][];
            distributions: components["schemas"]["Facet"][];
            criteria: components["schemas"]["Criteria"];
            references: components["schemas"]["ReferenceFilter"];
            includeProposals: boolean;
            /** @enum {string} */
            dateAxis: "publication" | "availability" | "source";
            /** @enum {string} */
            missingDates: "include" | "exclude" | "only";
            /** Format: date-time */
            observedAt: string;
            /** @constant */
            consistency: "pit_snapshot_revalidated_projection";
            reviewPolicy: string;
            selectionPolicy: string;
            candidateLimit: null;
            warnings: string[];
            /** @description Publicações do recorte completo após o filtro de referências, agrupadas por tribunal > órgão > relator e por código da classe processual. Nomes são metadados explícitos, sem inferência no texto. Nulos, ausentes e ambíguos têm contagens próprias. Opcional para compatibilidade; este backend sempre entrega. */
            judicialDistribution?: components["schemas"]["JudicialDistribution"];
        };
        RelatedPublication: {
            publication: components["schemas"]["Summary"];
            /** @enum {string} */
            reason: "same_process" | "similar_text" | "same_court_type";
        };
        RelatedPublicationsResponse: {
            publicationId: string;
            items: components["schemas"]["RelatedPublication"][];
            strategy: string;
            /** @constant */
            strategyVersion: "1";
            /** @constant */
            consistency: "projection_snapshot";
            warnings: string[];
        };
        PublicationTimelineRequest: {
            cnj: string | null;
            page: number;
            /** @constant */
            pageSize: 20;
        };
        PublicationTimelineResponse: {
            publicationId: string;
            processes: string[];
            selectedProcess: string | null;
            items: components["schemas"]["TimelineItem"][];
            page: number;
            /** @constant */
            pageSize: 20;
            total: components["schemas"]["Total"];
            hasMore: boolean;
            truncated: boolean;
            /** @constant */
            consistency: "projection_snapshot";
            warnings: string[];
            /** @enum {string} */
            processLinkPolicy: "canonical_primary" | "comunica_v2_legacy_metadata";
        };
        /** @description Metadados explícitos da fonte, sem inferência do corpo. Status ausente ou ambíguo não fornece valor. */
        JudicialMetadata: {
            rapporteur: string | null;
            organName: string | null;
            className: string | null;
            documentType: string | null;
            instanceDegree: string | null;
            /** @enum {string} */
            rapporteurStatus: "available" | "ambiguous" | "absent";
            /** @enum {string} */
            instanceDegreeStatus: "available" | "ambiguous" | "absent";
        };
        JudicialNameCount: {
            name: string;
            publications: number;
        };
        JudicialOrganDistribution: {
            name: string | null;
            publications: number;
            rapporteurs: components["schemas"]["JudicialNameCount"][];
            missingRapporteur: number;
            ambiguousRapporteur: number;
        };
        JudicialCourtDistribution: {
            name: string | null;
            publications: number;
            organs: components["schemas"]["JudicialOrganDistribution"][];
        };
        ProcessClassDistribution: {
            code: string;
            publications: number;
            names: components["schemas"]["JudicialNameCount"][];
            missingName: number;
        };
        JudicialDistribution: {
            courts: components["schemas"]["JudicialCourtDistribution"][];
            classes: components["schemas"]["ProcessClassDistribution"][];
            missingClassCode: number;
            missingClassName: number;
        };
        TimelineRecipient: {
            name: string | null;
            pole: string | null;
        };
        TimelineAttorney: {
            name: string | null;
            oabNumber: string | null;
            oabState: string | null;
        };
        TimelineItem: {
            id: string;
            revisionId: string;
            textVersionId: string;
            court: string | null;
            documentType: string | null;
            publicationDate: string | null;
            availabilityDate: string | null;
            sourceDate: string | null;
            processes: string[];
            snippets: components["schemas"]["Snippet"][];
            score: number | null;
            recipients?: components["schemas"]["TimelineRecipient"][] | null;
            attorneys?: components["schemas"]["TimelineAttorney"][] | null;
            /** @description Tipo de documento literal informado pela fonte em extensions.tipoDocumento; distinto do tipo de comunicação. */
            sourceDocumentType?: string | null;
        };
        EmentaSource: {
            ementaId: string;
            enrichmentId: string;
            revisionId: string;
            textVersionId: string;
            rulesVersion: string;
            inputTextSha256: string;
            configurationHash: string;
            start: number;
            end: number;
            /** @constant */
            offsetUnit: "unicode_codepoint";
            /** @enum {string} */
            reviewStatus: "unreviewed" | "proposed" | "validated" | "needs_review";
        };
        JurisprudencePreview: {
            /** @enum {string} */
            textKind: "ementa" | "publication";
            preview: components["schemas"]["PreviewSnippet"];
            ementaHighlights: components["schemas"]["Snippet"][];
            publicationHighlights: components["schemas"]["Snippet"][];
            truncated: boolean;
            ementaSource: components["schemas"]["EmentaSource"] | null;
        };
        PreviewSnippet: {
            text: string;
            highlights: components["schemas"]["Span"][];
        };
        SearchRanking: {
            /** @enum {string} */
            mode: "bm25" | "rerank";
            windowSize: number | null;
            candidates: number | null;
            truncated: boolean;
            /** @constant */
            version: "1";
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    searchPublications: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SearchRequest"];
            };
        };
        responses: {
            /** @description Sucesso */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SearchResponse"];
                };
            };
            /** @description Erro seguro versionado */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    readPublication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sucesso */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DetailResponse"];
                };
            };
            /** @description Erro seguro versionado */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    searchFacets: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FacetsRequest"];
            };
        };
        responses: {
            /** @description Sucesso */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FacetsResponse"];
                };
            };
            /** @description Erro seguro versionado */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    queryJurimetry: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["JurimetryRequest"];
            };
        };
        responses: {
            /** @description Sucesso */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JurimetryResponse"];
                };
            };
            /** @description Erro seguro versionado */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getCapabilities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sucesso */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CapabilitiesResponse"];
                };
            };
            /** @description Erro seguro versionado */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    closeSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CloseSessionRequest"];
            };
        };
        responses: {
            /** @description Sucesso */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CloseSessionResponse"];
                };
            };
            /** @description Erro seguro versionado */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    liveness: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sucesso */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
            /** @description Erro seguro versionado */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    readiness: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sucesso */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
            /** @description Erro seguro versionado */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Cluster ou contrato indisponível */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
        };
    };
    queryReferenceJurimetry: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferencesJurimetryRequest"];
            };
        };
        responses: {
            /** @description Sucesso */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReferencesJurimetryResponse"];
                };
            };
            /** @description Erro seguro versionado */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    recommendRelatedPublications: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sucesso */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RelatedPublicationsResponse"];
                };
            };
            /** @description Erro seguro versionado */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    queryPublicationTimeline: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PublicationTimelineRequest"];
            };
        };
        responses: {
            /** @description Sucesso */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicationTimelineResponse"];
                };
            };
            /** @description Erro seguro versionado */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Erro seguro versionado */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
