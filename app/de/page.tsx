import LandingPage from "../../components/landing-page";
import { listPublishedProperties } from "../../lib/db";

export const dynamic = "force-dynamic";

type GermanHomeProps = {
  searchParams?: Promise<{ joined?: string; error?: string }>;
};

export default async function GermanHome({ searchParams }: GermanHomeProps) {
  const params = (await searchParams) ?? {};
  const properties = await listPublishedProperties().catch(() => []);
  return (
    <LandingPage
      language="de"
      properties={properties}
      joined={params.joined === "1"}
      hasError={params.error === "1"}
    />
  );
}
