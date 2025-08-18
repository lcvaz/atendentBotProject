import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import type { Linter } from "eslint";

// Type assertion to bridge the compatibility gap between ESLint v9 and TypeScript ESLint v8
// This tells TypeScript to trust us that the plugin is compatible, despite the type differences
const typescriptPlugin = tsPlugin as any;

/**
 * Configuração do ESLint usando TypeScript e Flat Config
 *
 * Esta configuração demonstra como usar o novo sistema "flat config" do ESLint 9
 * com TypeScript, proporcionando type safety até mesmo para as configurações de linting.
 *
 * O flat config funciona como um array de objetos, onde cada objeto representa
 * um "layer" de configuração que pode ser aplicado a arquivos específicos.
 * Pense nisso como uma pilha de filtros, onde cada filtro pode modificar as regras
 * baseado no tipo de arquivo que está sendo processado.
 */

// Definimos nossa configuração como um array tipado do ESLint
const config: Linter.Config[] = [
  /**
   * LAYER 1: Configuração Base para JavaScript
   *
   * Esta camada estabelece as regras fundamentais que se aplicam a todos os
   * arquivos JavaScript e TypeScript. É nossa fundação - as regras universais
   * que todo código deve seguir independentemente da tecnologia específica.
   */
  {
    // Ao não especificar 'files', esta configuração se aplica globalmente
    // É como estabelecer as "leis fundamentais" do seu código
    name: "base-javascript-config",

    // Herdamos as configurações recomendadas do ESLint
    // Isso nos dá décadas de sabedoria coletiva da comunidade JavaScript
    ...js.configs.recommended,

    languageOptions: {
      // ECMAScript 2022 nos permite usar recursos modernos como top-level await
      ecmaVersion: 2022,

      // 'module' habilita import/export statements
      sourceType: "module",

      // Definimos variáveis globais do Node.js que são legítimas
      // Isso evita que o ESLint reclame de 'console', 'process', etc.
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },

    // Regras personalizadas que refinam o comportamento padrão
    // Aqui moldamos o linter para refletir nosso estilo de código preferido
    rules: {
      // Modernização: preferir const/let ao invés de var
      // 'var' tem comportamento de hoisting que pode causar bugs sutis
      "no-var": "error",
      "prefer-const": "error",

      // Detecta variáveis declaradas mas nunca utilizadas
      // Permite parâmetros que começam com underscore (convenção para "não usado")
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Consistência: exige ponto e vírgula no final das linhas
      // Evita problemas de ASI (Automatic Semicolon Insertion)
      semi: ["error", "always"],

      // Padronização: aspas simples para strings (mais limpo em JavaScript)
      quotes: ["error", "single", { avoidEscape: true }],

      // Detecta console.log esquecidos - útil para evitar logs em produção
      "no-console": "warn",
    },
  },

  /**
   * LAYER 2: Configuração Específica para TypeScript
   *
   * Esta camada se sobrepõe à anterior quando processamos arquivos TypeScript.
   * Aqui aproveitamos o sistema de tipos para fazer verificações muito mais
   * sofisticadas do que seria possível apenas com JavaScript.
   *
   * Note que estamos usando a versão 8.39.1 do TypeScript ESLint, que tem
   * uma API ligeiramente diferente da versão 9 que ainda não foi lançada.
   */
  {
    // Glob patterns que definem exatamente quais arquivos esta configuração afeta
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    name: "typescript-config",

    languageOptions: {
      // Parser específico que entende sintaxe TypeScript
      // Na versão 8.39.1, importamos diretamente do pacote do parser
      parser: tsParser,

      parserOptions: {
        // Conecta o ESLint ao sistema de tipos do TypeScript
        // Isso permite regras que verificam consistência de tipos
        project: "./tsconfig.json",

        // Define onde encontrar o tsconfig.json
        tsconfigRootDir: process.cwd(),

        // Habilita recursos experimentais do TypeScript se necessário
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },

      ecmaVersion: 2022,
      sourceType: "module",
    },

    // Plugins específicos do TypeScript
    // Usando type assertion para contornar incompatibilidade entre ESLint v9 e TypeScript ESLint v8
    plugins: {
      "@typescript-eslint": typescriptPlugin,
    },

    // Regras que aproveitam informação de tipos para verificações avançadas
    // Estamos sendo mais explícitos na definição dessas regras para evitar conflitos de tipos
    rules: {
      // Herdamos regras básicas recomendadas, mas de forma segura para types
      ...(typescriptPlugin.configs?.recommended?.rules || {}),

      // Substitui a regra JavaScript por uma versão que entende TypeScript
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Type Safety: força declaração explícita de tipos de retorno
      // Isso melhora a documentação e previne bugs sutis
      "@typescript-eslint/explicit-function-return-type": "warn",

      // Previne uso de 'any' - força você a ser específico com tipos
      // 'any' essencialmente desliga o TypeScript, então evitamos isso
      "@typescript-eslint/no-explicit-any": "error",

      // Detecta Promises que não estão sendo awaited adequadamente
      // Previne um erro muito comum em código assíncrono
      "@typescript-eslint/no-floating-promises": "error",

      // Consistência: prefer interface over type para definições de objeto
      // Interfaces são mais extensíveis e têm melhor performance de compilação
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],

      // Modernização: prefer nullish coalescing (??) quando apropriado
      // Mais preciso que || para valores falsy como 0 ou ''
      "@typescript-eslint/prefer-nullish-coalescing": "error",

      // Segurança: previne acesso a propriedades que podem ser undefined
      "@typescript-eslint/no-unnecessary-condition": "warn",

      // Performance: detecta comparações desnecessárias que são sempre true/false
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
    },
  },

  /**
   * LAYER 3: Configuração para Arquivos de Configuração
   *
   * Meta-configuração que define como o próprio ESLint e outros arquivos
   * de configuração devem ser tratados. Estes arquivos frequentemente têm
   * necessidades especiais (como usar require() em vez de import).
   */
  {
    files: [
      "eslint.config.*",
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
      "*.config.mts",
    ],
    name: "config-files",

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    // Arquivos de configuração podem ter regras mais relaxadas
    rules: {
      // Configurações podem legitimamente ter objetos grandes e complexos
      "@typescript-eslint/explicit-function-return-type": "off",

      // Console.log é comum em configurações para debugging
      "no-console": "off",
    },
  },

  /**
   * LAYER 4: Configuração para Arquivos de Teste
   *
   * Ambientes de teste têm suas próprias convenções e necessidades.
   * Por exemplo, é comum usar 'any' para mocks, ou ter funções muito
   * longas que configuram cenários de teste complexos.
   */
  {
    files: [
      "**/*.test.ts",
      "**/*.test.js",
      "**/*.spec.ts",
      "**/*.spec.js",
      "**/__tests__/**/*",
    ],
    name: "test-files",

    languageOptions: {
      globals: {
        // Variáveis globais comuns em ambientes de teste
        ...globals.jest,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },

    rules: {
      // Em testes, às vezes precisamos de 'any' para mocks complexos
      "@typescript-eslint/no-explicit-any": "off",

      // Funções de teste podem ser longas por configurarem cenários complexos
      "max-lines-per-function": "off",

      // Console.log em testes é útil para debugging
      "no-console": "off",

      // Testes podem ter muitas expectativas, então floating promises são ok
      "@typescript-eslint/no-floating-promises": "off",
    },
  },

  /**
   * LAYER 5: Arquivos a Ignorar
   *
   * Define explicitamente quais arquivos e diretórios devem ser
   * completamente ignorados pelo ESLint. É como criar uma "lista de exceções"
   * para conteúdo que não faz sentido verificar.
   */
  {
    name: "ignored-files",
    ignores: [
      // Dependências instaladas
      "node_modules/**",

      // Arquivos gerados durante o build
      "dist/**",
      "build/**",
      ".next/**",

      // Arquivos minificados (já processados)
      "*.min.js",
      "*.min.css",

      // Relatórios de cobertura de testes
      "coverage/**",
      ".nyc_output/**",

      // Controle de versão
      ".git/**",

      // Arquivos temporários
      "tmp/**",
      ".tmp/**",

      // Logs
      "*.log",
      "logs/**",
    ],
  },
];

// Exporta a configuração como default export
// O ESLint 9 procura especificamente por esta estrutura
export default config;
