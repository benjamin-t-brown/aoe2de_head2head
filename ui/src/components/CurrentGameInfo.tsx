import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import theme from '../theme';
import PlayerNameLink from './PlayerNameLink';

const useCurrentGameInfoStyles = makeStyles({
  root: {
    padding: '10px',
    background: 'rgba(0, 0, 0, 0.1)',
    boxShadow: '0px 0px 5px 4px rgba(0, 0, 0, 0.1)',
    width: '550px',
    overflow: 'hidden',
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
  cell: {
    padding: '5px',
  },
});

interface Player {
  name: string;
  profileId: string;
  rating: number;
}

interface CurrentGameInfoProps {
  playerId: string;
  matchId: string;
  playerName: string;
  inProgress: boolean;
  isWin: boolean;
  myTeamPlayers: Player[];
  otherTeamPlayers: Player[];
  date: string;
}

export const gameResponseToProps = (
  playerId: string,
  gameResponse: any
): CurrentGameInfoProps => {
  let playerName = playerId;
  let isWin = null;
  const myTeamId = gameResponse.players.reduce((prev: number, curr: any) => {
    if (curr.profile_id === playerId) {
      playerName = curr.name;
      isWin = curr.won;
      return curr.team;
    } else {
      return prev;
    }
  }, 1);
  const myTeamPlayers = gameResponse.players
    .filter((player: any) => {
      return player.team === myTeamId;
    })
    .map((player: any) => {
      return {
        profileId: player.profile_id,
        name: player.name,
        rating: player.rating,
      };
    });
  const otherTeamPlayers = gameResponse.players
    .filter((player: any) => {
      return player.team !== myTeamId;
    })
    .map((player: any) => {
      return {
        profileId: player.profile_id,
        name: player.name,
        rating: player.rating,
      };
    });

  return {
    playerId,
    playerName,
    matchId: gameResponse.match_id,
    inProgress: isWin === null ? true : !gameResponse.finished,
    isWin: !!isWin,
    myTeamPlayers,
    otherTeamPlayers,
    date: new Date(gameResponse.started * 1000).toLocaleString(),
  };
};

const CurrentGameInfo = (props: CurrentGameInfoProps) => {
  const classes = useCurrentGameInfoStyles();
  return (
    <div className={classes.root}>
      Most Recent Game{' '}
      {props.inProgress ? (
        <>
          <span className={classes.inProgress}>In Progress</span>{' '}
          <span> Game Id: {props.matchId}</span>
        </>
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
              <th
                style={{
                  minWidth: '180px',
                  textAlign: 'left',
                }}
              >
                {props.playerName}'s Team
              </th>
              <th>Opposing Team</th>
            </tr>
          </thead>
          <tbody>
            {props.otherTeamPlayers.map(
              (otherTeamPlayer: Player, i: number) => {
                const myTeamPlayer = props.myTeamPlayers[i];
                return (
                  <tr key={'row-' + i}>
                    <td className={classes.cell} style={{ textAlign: 'left' }}>
                      <PlayerNameLink
                        playerId={myTeamPlayer.profileId}
                        playerName={`${myTeamPlayer.name} (${myTeamPlayer.rating})`}
                        light
                      />
                    </td>
                    <td className={classes.cell} style={{ textAlign: 'right' }}>
                      <PlayerNameLink
                        playerId={otherTeamPlayer.profileId}
                        playerName={`${otherTeamPlayer.name} (${otherTeamPlayer.rating})`}
                        light
                      />
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
