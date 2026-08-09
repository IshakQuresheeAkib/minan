import {
  serializeJsonLd,
  type JsonLdObject,
} from "@/lib/seo/structured-data";

type JsonLdProps = {
  data: JsonLdObject;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
