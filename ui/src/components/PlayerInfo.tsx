import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import PlayerNameLink from './PlayerNameLink';

const usePlayerInfoStyles = makeStyles({
  playerLink: {
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '5px',
    padding: '5px',
  },
});

interface PlayerInfoProps {
  playerName: string;
  playerId: string;
  leaderboardName: string;
  numRecords: number;
}

const PlayerInfo = (props: PlayerInfoProps) => {
  const classes = usePlayerInfoStyles();

  if (props.numRecords === 0) {
    return <div></div>;
  }

  return (
    <div>
      Displaying {props.numRecords} players for leaderboard "
      {props.leaderboardName}", player{' '}
      <span className={classes.playerLink}>
        <PlayerNameLink
          playerId={props.playerId}
          playerName={props.playerName}
        />
      </span>
    </div>
  );
};

export default PlayerInfo;
