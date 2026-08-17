import type { ReactElement } from "react";
import { Icon, NonIdealState, NonIdealStateIconSize } from "@blueprintjs/core";
import type { Osdk } from "@osdk/client";
import {
  investigationCase,
  organization,
  ownershipInterest,
  person,
  wallet,
} from "@ontology/sdk";
import { useLinks } from "@osdk/react";
import WalletRow from "./WalletRow";
import css from "./desk.module.css";

function WalletList({
  wallets,
  isLoading,
}: {
  wallets: Osdk.Instance<wallet>[];
  isLoading: boolean;
}): ReactElement | null {
  if (isLoading) return <p className={css.muted}>Loading wallets…</p>;
  if (wallets.length === 0) return null;

  return (
    <div className={css.walletList}>
      {wallets.map((item) => (
        <WalletRow key={item.$primaryKey} item={item} />
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

function BeneficialOwner({
  interest,
}: {
  interest: Osdk.Instance<ownershipInterest>;
}): ReactElement {
  const { links, isLoading } = useLinks(interest, "beneficialOwner", {
    pageSize: 1,
  });
  const owner = links?.find(Boolean);

  if (isLoading) return <p className={css.muted}>Loading owner…</p>;
  if (owner == null) {
    return <p className={css.muted}>Beneficial owner not found.</p>;
  }

  return (
    <div className={css.ownershipBlock}>
      <div className={css.subjectType}>
        <Icon icon="person" size={12} aria-hidden="true" />
        {interest.role ?? "Beneficial owner"}
      </div>
      <p className={css.subjectName}>{owner.name}</p>
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

  if (isLoading) return <p className={css.muted}>Loading ownership…</p>;
  if (interests.length === 0) return null;

  return (
    <div className={css.ownership}>
      <span className={css.sectionTitle}>Ownership</span>
      {interests.map((interest) => (
        <BeneficialOwner key={interest.$primaryKey} interest={interest} />
      ))}
    </div>
  );
}

function PersonFile({ subject }: { subject: Osdk.Instance<person> }): ReactElement {
  return (
    <div className={css.subjectFile}>
      <div className={css.subjectType}>
        <Icon icon="person" size={12} aria-hidden="true" />
        Person
      </div>
      <p className={css.subjectName}>{subject.name}</p>
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

function OrganizationFile({
  subject,
}: {
  subject: Osdk.Instance<organization>;
}): ReactElement {
  return (
    <div className={css.subjectFile}>
      <div className={css.subjectType}>
        <Icon icon="office" size={12} aria-hidden="true" />
        {subject.legalForm ?? "Organization"}
      </div>
      <p className={css.subjectName}>{subject.name}</p>
      <div className={css.caseMeta}>
        <span>{subject.jurisdiction}</span>
      </div>
      {subject.notes != null && subject.notes !== "" && (
        <p className={css.findingBody}>{subject.notes}</p>
      )}
      <OrganizationWallets subject={subject} />
      <OrganizationOwnership subject={subject} />
    </div>
  );
}

export default function SubjectPanel({
  item,
}: {
  item: Osdk.Instance<investigationCase>;
}): ReactElement {
  const { links: people, isLoading: personLoading } = useLinks(
    item,
    "subjectPerson",
    { pageSize: 1 },
  );
  const { links: orgs, isLoading: orgLoading } = useLinks(
    item,
    "subjectOrganization",
    { pageSize: 1 },
  );

  const subjectPerson = people?.find(Boolean);
  const subjectOrganization = orgs?.find(Boolean);
  const isLoading = personLoading || orgLoading;
  const hasSubject = subjectPerson != null || subjectOrganization != null;

  return (
    <section className={css.section} aria-labelledby="subjects-heading">
      <h2 id="subjects-heading" className={css.sectionTitle}>
        Subject
      </h2>
      {isLoading && <p className={css.muted}>Loading subject…</p>}
      {!isLoading && !hasSubject && (
        <NonIdealState
          icon="person"
          iconSize={NonIdealStateIconSize.SMALL}
          layout="horizontal"
          title="No subject linked"
          description="This case has no person or organization."
        />
      )}
      {subjectPerson != null && <PersonFile subject={subjectPerson} />}
      {subjectOrganization != null && (
        <OrganizationFile subject={subjectOrganization} />
      )}
    </section>
  );
}
