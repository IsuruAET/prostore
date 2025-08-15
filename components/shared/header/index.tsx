import Menu from "./menu";
import Logo from "../logo";
import CategoryDrawer from "./category-drawer";
import Search from "./search";

const Header = () => {
  return (
    <header className="w-full border-b">
      <div className="wrapper flex-between">
        <div className="flex-start space-x-2">
          <CategoryDrawer />
          <Logo
            size={48}
            showText={true}
            priority={true}
            href="/"
            className="flex-start ml-4"
          />
        </div>
        <div className="hidden md:block space-x-2">
          <Search />
        </div>
        <div className="space-x-2">
          <Menu />
        </div>
      </div>
    </header>
  );
};

export default Header;
