import { v4 as uuidv4 } from 'uuid';

/**
 * 替换 JSON 中的指定 UUID
 * @param jsonData 原始 JSON 对象
 * @param targetUuid 要替换的 UUID（小写字符串）
 * @returns { newJson: object, newUuid: string }
 */
export function replaceUuidSafely(jsonData: object, targetUuid: string): { newJson: object, newUuid: string } {
  const jsonStr = JSON.stringify(jsonData);

  // 生成新的 UUID，直到不重复为止
  let newUuid = uuidv4();
  while (jsonStr.includes(newUuid)) {
    newUuid = uuidv4();
  }

  // 替换完全匹配的 UUID（不替换子串）
  const safeStr = jsonStr.replace(
    new RegExp(`(?<![a-z0-9-])${targetUuid}(?![a-z0-9-])`, 'gi'),
    newUuid
  );

  // 解析回 JSON
  const newJson = JSON.parse(safeStr) as object;
  return { newJson, newUuid };
}
