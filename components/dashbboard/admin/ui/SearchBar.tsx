import { SearchIcon } from "lucide-react";

export const SearchBar = () => {
  return (
    <div className="relative w-full md:w-1-3">
      <input
        type="search"
        placeholder="Search..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon />
      </div>
    </div>
  );
};
