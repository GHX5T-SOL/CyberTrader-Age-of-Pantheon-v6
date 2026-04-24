import * as React from "react";

export const MenuContext = React.createContext({
  openMenu: () => {},
  closeMenu: () => {},
});

export const useMenu = () => React.useContext(MenuContext);

