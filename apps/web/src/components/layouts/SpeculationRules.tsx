const rules = {
  prerender: [
    {
      source: "document",
      where: {
        and: [
          {
            or: [
              { href_matches: "/products*" },
              { href_matches: "/collections/*" },
            ],
          },
          { not: { selector_matches: "[data-no-prerender]" } },
        ],
      },
      eagerness: "moderate",
    },
  ],
};

export function SpeculationRules() {
  return (
    <script
      type="speculationrules"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(rules) }}
    />
  );
}
