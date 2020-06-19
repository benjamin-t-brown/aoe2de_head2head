import React from 'react';
import Input from '@material-ui/core/OutlinedInput';
import InputAdornment from '@material-ui/core/InputAdornment';
import SearchIcon from '@material-ui/icons/Search';
import { withStyles } from '@material-ui/core';

interface InputProps {
  value?: string;
  placeholder?: string;
  onChange?: (ev?: React.SyntheticEvent) => void;
  onKeyDown?: (ev?: React.SyntheticEvent) => void;
  showSearchIcon?: boolean;
}

const StyledInput = withStyles(() => ({
  root: {
    background: 'white',
  },
}))(Input);

const TextInput = (props: InputProps): JSX.Element => {
  const { value, placeholder, onChange, onKeyDown } = props;
  return (
    <StyledInput
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      onKeyDown={onKeyDown}
      inputProps={{
        maxLength: 25,
      }}
      startAdornment={
        <InputAdornment position="start">
          <SearchIcon />
        </InputAdornment>
      }
    ></StyledInput>
  );
};

export default TextInput;
