import { ResultHeader } from "../drivers/base";

export function transformArrayBasedResult<HeaderType>(
  headers: HeaderType[],
  headersMapper: (header: HeaderType) => {
    name: string;
    type?: number;
    originalType: string | null;
  },
  arr: unknown[][]
) {
  // Building the headers
  const usedColumnName = new Set();

  const headerMap: ResultHeader[] = headers.map((header) => {
    const { name, type, originalType } = headersMapper(header);
    let finalColumnName = name;

    // We got the duplicated column name, let try to find it a new name
    if (usedColumnName.has(finalColumnName)) {
      // If there is table name, let use it as prefix
      for (let i = 1; i < 100; i++) {
        if (usedColumnName.has(finalColumnName)) {
          finalColumnName = `${name}${i}`;
        } else {
          break;
        }
      }
    }

    // Hope we don't run into this situation.
    if (usedColumnName.has(finalColumnName)) {
      throw new Error("Cannot find unique column name");
    }

    usedColumnName.add(finalColumnName);
    return { name: finalColumnName, displayName: name, type, originalType };
  });

  // Mapping the data
  const data = arr.map((row) => {
    return headerMap.reduce((acc, header, index) => {
      acc[header.name] = row[index];
      return acc;
    }, {} as Record<string, unknown>);
  });

  return {
    rows: data,
    headers: headerMap,
  };
}
