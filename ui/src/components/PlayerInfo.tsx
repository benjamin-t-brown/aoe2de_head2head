import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import PlayerNameLink from './PlayerNameLink';

const usePlayerInfoStyles = makeStyles({
  root: {
    display: 'flex',
    justifyContent: 'center',
  },
  subRoot: {
    padding: '10px',
    width: '550px',
    background: 'rgba(0, 0, 0, 0.1)',
    boxShadow: '0px 0px 5px 4px rgba(0, 0, 0, 0.1)',
    color: 'white',
    lineHeight: '2',
  },
  playerLink: {
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '5px',
    padding: '5px',
    color: 'black',
  },
});

interface PlayerInfoProps {
  playerName: string;
  playerId: string;
  leaderboardName: string;
  numRecords: number;
  numGames: number;
}

const PlayerInfo = (props: PlayerInfoProps) => {
  const classes = usePlayerInfoStyles();

  if (props.numRecords === 0) {
    return <div></div>;
  }

  return (
    <div className={classes.root}>
      <div className={classes.subRoot}>
        {props.numGames} games, {props.numRecords} opponents, leaderboard{' '}
        <span className={classes.playerLink}>
          {props.leaderboardName.toUpperCase()}
        </span>{' '}
        for player{' '}
        <span className={classes.playerLink}>
          <PlayerNameLink
            playerId={props.playerId}
            playerName={props.playerName}
          />
        </span>
      </div>
    </div>
  );
};

export default PlayerInfo;
