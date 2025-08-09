import Menu from "./menu";
import Logo from "../logo";

const Header = () => {
  return (
    <header className="w-full border-b">
      <div className="wrapper flex-between">
        <Logo
          size={48}
          showText={true}
          priority={true}
          href="/"
          className="flex-start"
        />
        <div className="space-x-2">
          <Menu />
        </div>
      </div>
    </header>
  );
};

export default Header;
