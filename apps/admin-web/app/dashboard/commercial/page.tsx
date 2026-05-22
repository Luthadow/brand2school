import { Suspense } from "react";
import { CommercialGovernanceClient } from "./ui";

export default function CommercialGovernancePage(): JSX.Element {
  return (
    <Suspense fallback={<p>Loading commercial workflow…</p>}>
      <CommercialGovernanceClient />
    </Suspense>
  );
}
