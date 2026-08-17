type WithId = {
    id?: string | undefined;
    $primaryKey: string | number;
};

/**
 * Prefer the authored `id` property. Fall back to the OSDK primary key when
 * the property has not loaded (common on action-passed object parameters).
 */
export function objectId(row: WithId): string {
    if (row.id != null && row.id !== "") {
        return String(row.id);
    }
    return String(row.$primaryKey);
}

export function optionalObjectId(row: WithId | undefined): string | undefined {
    if (row == null) {
        return undefined;
    }
    return objectId(row);
}
