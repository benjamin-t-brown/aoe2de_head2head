import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import theme from '../theme';

const useCurrentGameInfoStyles = makeStyles({
  root: {
    padding: '10px',
    background: 'rgba(0, 0, 0, 0.1)',
    boxShadow: '0px 0px 5px 4px rgba(0, 0, 0, 0.1)',
  },
  tableContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  table: {
    background: 'rgba(0, 0, 0, 0.4)',
    boxShadow: '0px 0px 5px 4px rgba(0, 0, 0, 0.4)',
    padding: '10px',
    marginTop: '16px',
    color: 'white',
  },
  inProgress: {
    color: theme.palette.status.neutral,
    background: 'black',
    padding: '5px',
    borderRadius: '5px',
  },
  victory: {
    color: theme.palette.status.success,
    background: 'black',
    padding: '5px',
    borderRadius: '5px',
  },
  loss: {
    color: theme.palette.status.danger,
    background: 'black',
    padding: '5px',
    borderRadius: '5px',
  },
});

interface Player {
  name: string;
  profileId: string;
  rating: number;
}

interface CurrentGameInfoProps {
  playerId: string;
  playerName: string;
  inProgress: boolean;
  isWin: boolean;
  myTeamPlayers: Player[];
  otherTeamPlayers: Player[];
}

export const gameResponseToProps = (
  playerId: string,
  gameResponse: any
): CurrentGameInfoProps => {
  let playerName = playerId;
  let isWin = false;
  const myTeamId = gameResponse.players.reduce((prev: number, curr: any) => {
    if (curr.profile_id === playerId) {
      playerName = curr.name;
      isWin = curr.won;
      return curr.team;
    } else {
      return prev;
    }
  }, 1);
  const myTeamPlayers = gameResponse.players.filter((player: any) => {
    return player.team === myTeamId;
  });
  const otherTeamPlayers = gameResponse.players.filter((player: any) => {
    return player.team !== myTeamId;
  });
  return {
    playerId,
    playerName,
    inProgress: !gameResponse.finished,
    isWin,
    myTeamPlayers,
    otherTeamPlayers,
  };
};

const CurrentGameInfo = (props: CurrentGameInfoProps) => {
  const classes = useCurrentGameInfoStyles();
  return (
    <div className={classes.root}>
      Most Recent Game{' '}
      {props.inProgress ? (
        <span className={classes.inProgress}>In Progress</span>
      ) : null}
      {!props.inProgress && props.isWin ? (
        <span className={classes.victory}>Victory</span>
      ) : null}
      {!props.inProgress && !props.isWin ? (
        <span className={classes.loss}>Loss</span>
      ) : null}
      <div className={classes.tableContainer}>
        <table className={classes.table}>
          <thead>
            <tr>
              <th>{props.playerName}'s Team</th>
              <th>Opposing Team</th>
            </tr>
          </thead>
          <tbody>
            {props.otherTeamPlayers.map(
              (otherTeamPlayer: Player, i: number) => {
                const myTeamPlayer = props.myTeamPlayers[i];
                return (
                  <tr key={'row-' + i}>
                    <td style={{ textAlign: 'left' }}>
                      {myTeamPlayer.name} ({myTeamPlayer.rating})
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {otherTeamPlayer.name} ({otherTeamPlayer.rating})
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurrentGameInfo;
