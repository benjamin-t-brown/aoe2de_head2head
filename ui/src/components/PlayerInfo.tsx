import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import theme from '../theme';

const usePlayerInfoStyles = makeStyles({
  link: {
    cursor: 'pointer',
    color: theme.palette.typography.link,
    '&:hover': {
      textDecoration: 'underline',
    },
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
      <span
        className={classes.link}
        onClick={() => {
          window.open(`https://aoe2.net/#profile-${props.playerId}`);
        }}
      >
        {props.playerName}
      </span>
    </div>
  );
};

export default PlayerInfo;
