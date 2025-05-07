import { useScrollToTop } from '../hooks/useScrollToTop';

const ScrollToTopWrapper = ({ children }) => {
  useScrollToTop();
  return children;
};

export default ScrollToTopWrapper; 