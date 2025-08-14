import React from "react";

interface LibraryPageProps {
  currentUser?: any;
}

const LibraryPage: React.FC<LibraryPageProps> = ({ currentUser }) => {
  return (
    <div className="library-page-spa">
      <h1>Library</h1>
      <p>Library page will be implemented here</p>
    </div>
  );
};

export default LibraryPage;
