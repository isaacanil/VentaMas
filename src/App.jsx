import { Fragment } from 'react';
import { RouterProvider } from 'react-router';

import PwaUpdatePrompt from './components/PwaUpdatePrompt/PwaUpdatePrompt';
import { router } from './router';

function App() {
  return (
    <Fragment>
      <PwaUpdatePrompt />
      <RouterProvider router={router} />
    </Fragment>
  );
}

export default App;
