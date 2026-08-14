import type { ReactElement } from "react";
import { Tag } from "@blueprintjs/core";
import type { Osdk } from "@osdk/client";
import { organization, ownershipInterest, person, wallet } from "@ontology/sdk";
import { useLinks, useOsdkObject } from "@osdk/react";
import css from "./desk.module.css";

function WalletList({
  wallets,
  isLoading,
}: {
  wallets: Osdk.Instance<wallet>[];
  isLoading: boolean;
}): ReactElement {
  if (isLoading) return <p className={css.brandMark}>Loading wallets…</p>;
  if (wallets.length === 0) {
    return <p className={css.brandMark}>No wallets attributed.</p>;
  }

  return (
    <div className={css.stack}>
      {wallets.map((item) => (
        <div key={item.$primaryKey} className={css.walletRow}>
          <span>{item.label}</span>
          <Tag minimal>{item.chain}</Tag>
          <span className={css.mono} title={item.address}>
            {item.address}
          </span>
        </div>
      ))}
    </div>
  );
}

function PersonWallets({ subject }: { subject: Osdk.Instance<person> }): ReactElement {
  const { links, isLoading } = useLinks(subject, "personWallets", { pageSize: 50 });
  return <WalletList wallets={links?.filter(Boolean) ?? []} isLoading={isLoading} />;
}

function OrganizationWallets({
  subject,
}: {
  subject: Osdk.Instance<organization>;
}): ReactElement {
  const { links, isLoading } = useLinks(subject, "organizationWallets", {
    pageSize: 50,
  });
  return <WalletList wallets={links?.filter(Boolean) ?? []} isLoading={isLoading} />;
}

function BeneficialOwnerCard({
  interest,
}: {
  interest: Osdk.Instance<ownershipInterest>;
}): ReactElement {
  const { object: owner, isLoading } = useOsdkObject(
    person,
    interest.personId ?? "",
    { enabled: interest.personId != null && interest.personId !== "" },
  );

  if (isLoading) return <p className={css.brandMark}>Loading owner…</p>;
  if (owner == null) {
    return <div className={css.card}>Beneficial owner not found.</div>;
  }

  return (
    <div className={css.card}>
      <div className={css.queueItemTop}>
        <strong>{owner.name}</strong>
        <Tag minimal>{interest.role ?? "Owner"}</Tag>
      </div>
      <div className={css.caseMeta}>
        <span>{owner.jurisdiction}</span>
      </div>
      {owner.notes != null && owner.notes !== "" && (
        <p className={css.findingBody}>{owner.notes}</p>
      )}
      <PersonWallets subject={owner} />
    </div>
  );
}

function OrganizationOwnership({
  subject,
}: {
  subject: Osdk.Instance<organization>;
}): ReactElement | null {
  const { links, isLoading } = useLinks(subject, "organizationOwnership", {
    pageSize: 50,
  });
  const interests = links?.filter(Boolean) ?? [];

  if (isLoading || interests.length === 0) {
    return null;
  }

  return (
    <>
      {interests.map((interest) => (
        <BeneficialOwnerCard key={interest.$primaryKey} interest={interest} />
      ))}
    </>
  );
}

function PersonCard({ subject }: { subject: Osdk.Instance<person> }): ReactElement {
  return (
    <div className={css.card}>
      <div className={css.queueItemTop}>
        <strong>{subject.name}</strong>
        <Tag minimal>Person</Tag>
      </div>
      <div className={css.caseMeta}>
        <span>{subject.jurisdiction}</span>
      </div>
      {subject.notes != null && subject.notes !== "" && (
        <p className={css.findingBody}>{subject.notes}</p>
      )}
      <PersonWallets subject={subject} />
    </div>
  );
}

function OrganizationCard({
  subject,
}: {
  subject: Osdk.Instance<organization>;
}): ReactElement {
  return (
    <>
      <div className={css.card}>
        <div className={css.queueItemTop}>
          <strong>{subject.name}</strong>
          <Tag minimal>{subject.legalForm ?? "Organization"}</Tag>
        </div>
        <div className={css.caseMeta}>
          <span>{subject.jurisdiction}</span>
        </div>
        {subject.notes != null && subject.notes !== "" && (
          <p className={css.findingBody}>{subject.notes}</p>
        )}
        <OrganizationWallets subject={subject} />
      </div>
      <OrganizationOwnership subject={subject} />
    </>
  );
}

export default function SubjectPanel({
  personId,
  organizationId,
}: {
  personId: string | undefined;
  organizationId: string | undefined;
}): ReactElement {
  const { object: subjectPerson, isLoading: personLoading } = useOsdkObject(
    person,
    personId ?? "",
    { enabled: personId != null && personId !== "" },
  );
  const { object: subjectOrganization, isLoading: orgLoading } = useOsdkObject(
    organization,
    organizationId ?? "",
    { enabled: organizationId != null && organizationId !== "" },
  );

  const isLoading = personLoading || orgLoading;
  const hasSubject = subjectPerson != null || subjectOrganization != null;

  return (
    <section className={css.section} aria-labelledby="subjects-heading">
      <h2 id="subjects-heading" className={css.sectionTitle}>
        Subjects
      </h2>
      {isLoading && <p className={css.brandMark}>Loading subject…</p>}
      {!isLoading && !hasSubject && (
        <div className={css.card}>No subject linked to this case.</div>
      )}
      {subjectPerson != null && <PersonCard subject={subjectPerson} />}
      {subjectOrganization != null && (
        <OrganizationCard subject={subjectOrganization} />
      )}
    </section>
  );
}
