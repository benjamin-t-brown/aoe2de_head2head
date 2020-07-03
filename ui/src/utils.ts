export const getNameAndLeaderboardFromHash = (hash: string) => {
  hash = decodeURIComponent(hash);
  const defaultPlayerName = hash.slice(1).split(',')[0].slice(0, 25) || '';
  let defaultLeaderboardName = hash.slice(1).split(',')[1];
  if (defaultLeaderboardName !== 'solo' && defaultLeaderboardName !== 'team') {
    defaultLeaderboardName = '';
  }
  return [defaultPlayerName, defaultLeaderboardName];
};
