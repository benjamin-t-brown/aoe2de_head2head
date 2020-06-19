import React from 'react';

interface PlayerInfoProps {
  playerName: string;
  leaderboardName: string;
  numRecords: number;
}

const PlayerInfo = (props: PlayerInfoProps) => {
  if (props.numRecords === 0) {
    return <div></div>;
  }

  return (
    <div>
      Displaying {props.numRecords} players for leaderboard "
      {props.leaderboardName}", player "{props.playerName}"
    </div>
  );
};

export default PlayerInfo;
