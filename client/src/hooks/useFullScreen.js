import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectFullScreen } from "../features/setting/settingSlice";

export function useFullScreen() {
  const fullscreen = useSelector(selectFullScreen);

  useEffect(() => {
    if (fullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  }, [fullscreen]);
}
