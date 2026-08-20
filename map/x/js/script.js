* { box-sizing: border-box; margin: 0; padding: 0; touch-action: none; user-select: none; }

body, html { width: 100%; height: 100%; overflow: hidden; background-color: #0b0c10; color: #fff; font-family: sans-serif; }

#gameCanvas { width: 100%; height: 100%; display: block; }

#top-bar {
    position: absolute; top: 0; left: 0; width: 100%; height: 40px;
    background: rgba(15, 15, 26, 0.85);
    display: flex; justify-content: space-between; align-items: center;
    padding: 0 15px; border-bottom: 2px solid #1f2833; font-size: 12px; color: #66fcf1;
}

#controls-container { position: absolute; bottom: 20px; left: 20px; }

#joystick-zone {
    width: 100px; height: 100px;
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(102, 252, 241, 0.3);
    border-radius: 50%;
}

#joystick-stick {
    width: 40px; height: 40px; background: #66fcf1; border-radius: 50%;
    position: absolute; top: 28px; left: 28px; box-shadow: 0 0 10px rgba(102, 252, 241, 0.6);
}
