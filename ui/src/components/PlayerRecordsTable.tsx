import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import moment from 'moment';
import { LookupQueryResult } from '../hooks/axiosHooks';
import theme from '../theme';
import PlayerNameLink from './PlayerNameLink';

const SORT_DIR_ASC = 'asc';
const SORT_DIR_DSC = 'dsc';

const StyledTableCell = withStyles(theme => ({
  head: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  body: {
    fontSize: 14,
  },
}))(TableCell);

const StyledTableRow = withStyles(theme => ({
  root: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}))(TableRow);

const useStyles = makeStyles({
  table: {
    minWidth: 700,
  },
  tableHeadCell: {
    cursor: 'pointer',
    '&:hover': {
      filter: 'brightness(120%)',
    },
  },
  error: {
    color: theme.palette.status.danger,
    background: theme.palette.secondary.main,
    padding: '1rem',
  },
  link: {
    cursor: 'pointer',
    color: theme.palette.typography.link,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});

interface PlayerRecordsTable {
  data?: LookupQueryResult;
  loading?: boolean;
  error?: boolean;
}

const PlayerRecordsTable = (props: PlayerRecordsTable) => {
  const [sortColumn, setSortColumn] = React.useState('last_played_against');
  const [sortDirection, setSortDirection] = React.useState(SORT_DIR_DSC);
  const classes = useStyles();

  const handleTableHeaderClick = (nextSortColumn: string) => {
    if (nextSortColumn === sortColumn) {
      setSortDirection(
        sortDirection === SORT_DIR_ASC ? SORT_DIR_DSC : SORT_DIR_ASC
      );
    } else {
      if (nextSortColumn === 'name') {
        setSortDirection(SORT_DIR_ASC);
      } else {
        setSortDirection(SORT_DIR_DSC);
      }
      setSortColumn(nextSortColumn);
    }
  };

  if (props.loading) {
    return <CircularProgress />;
  }

  if (props.error || !props.data) {
    return (
      <div className={classes.error}>
        No player exists with searched name on the given leaderboard.
      </div>
    );
  }

  const data = props.data as LookupQueryResult;
  (window as any).data = data;

  const profileIds = Object.keys(data.tracker.records)
    .filter(profileId => {
      const record = data.tracker.records[profileId];
      return record.wins_against + record.losses_to > 0;
    })
    .sort((a, b) => {
      const playerA = data.tracker.players[a];
      const recordA = data.tracker.records[a];

      const playerB = data.tracker.players[b];
      const recordB = data.tracker.records[b];

      let columnA = recordA[sortColumn];
      let columnB = recordB[sortColumn];

      if (sortColumn === 'name') {
        columnA = playerA.name.toLowerCase();
        columnB = playerB.name.toLowerCase();
      } else if (sortColumn === 'num_games') {
        columnA = recordA.wins_against + recordA.losses_to;
        columnB = recordB.wins_against + recordB.losses_to;
      }

      if (sortDirection === SORT_DIR_ASC) {
        return columnA < columnB ? -1 : 1;
      } else if (sortDirection === SORT_DIR_DSC) {
        return columnA < columnB ? 1 : -1;
      } else {
        return 0;
      }
    });

  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell
              onClick={() => {
                handleTableHeaderClick('name');
              }}
              className={classes.tableHeadCell}
              align="center"
            >
              Player Name {sortColumn === 'name' ? `(${sortDirection})` : ''}
            </StyledTableCell>
            <StyledTableCell
              onClick={() => {
                handleTableHeaderClick('rating');
              }}
              className={classes.tableHeadCell}
              align="center"
            >
              Rating Last Played{' '}
              {sortColumn === 'rating' ? `(${sortDirection})` : ''}
            </StyledTableCell>
            <StyledTableCell
              onClick={() => {
                handleTableHeaderClick('num_games');
              }}
              className={classes.tableHeadCell}
              align="center"
            >
              Num Games {sortColumn === 'num_games' ? `(${sortDirection})` : ''}
            </StyledTableCell>
            <StyledTableCell
              onClick={() => {
                handleTableHeaderClick('wins_against');
              }}
              className={classes.tableHeadCell}
              align="center"
            >
              Wins Against{' '}
              {sortColumn === 'wins_against' ? `(${sortDirection})` : ''}
            </StyledTableCell>
            <StyledTableCell
              onClick={() => {
                handleTableHeaderClick('losses_to');
              }}
              className={classes.tableHeadCell}
              align="center"
            >
              Losses To {sortColumn === 'losses_to' ? `(${sortDirection})` : ''}
            </StyledTableCell>
            <StyledTableCell
              onClick={() => {
                handleTableHeaderClick('last_played_against');
              }}
              className={classes.tableHeadCell}
              align="center"
            >
              Last Played{' '}
              {sortColumn === 'last_played_against' ? `(${sortDirection})` : ''}
            </StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {profileIds.map(profileId => {
            const player = data.tracker.players[profileId];
            const record = data.tracker.records[profileId];

            const date = moment.utc(record.last_played_against);

            return (
              <StyledTableRow key={profileId}>
                <StyledTableCell component="th" scope="row">
                  <PlayerNameLink
                    playerId={player.steam_id || player.profile_id}
                    playerName={player.name}
                  />
                </StyledTableCell>
                <StyledTableCell component="th" scope="row">
                  {player.rating}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {record.wins_against + record.losses_to}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {record.wins_against}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {record.losses_to}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {moment(date).local().format('YYYY-MM-DD hh:mm:ss A')}
                </StyledTableCell>
              </StyledTableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PlayerRecordsTable;
