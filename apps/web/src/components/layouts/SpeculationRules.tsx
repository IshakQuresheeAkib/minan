const rules = {
  prerender: [
    {
      source: "document",
      where: {
        and: [
          { href_matches: "/products*" },
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
