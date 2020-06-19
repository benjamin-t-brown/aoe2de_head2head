import React from 'react';
import ButtonMui from '@material-ui/core/Button';

export interface ButtonProps {
  type: 'inherit' | 'primary' | 'secondary' | 'default' | undefined;
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: (ev: React.SyntheticEvent) => void;
}

const Button = (props: ButtonProps): JSX.Element => {
  return (
    <ButtonMui
      variant="contained"
      onClick={props.onClick}
      disabled={props.disabled}
      color={props.type}
    >
      {props.children}
    </ButtonMui>
  );
};

export default Button;
