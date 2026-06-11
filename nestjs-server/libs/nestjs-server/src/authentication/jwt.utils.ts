export function getKeyIdFromToken(rawJwtToken: string): string {
  const tokenElements = rawJwtToken.split('.');
  const header = JSON.parse(Buffer.from(tokenElements[0], 'base64').toString('utf8'));
  return header['kid'];
}
