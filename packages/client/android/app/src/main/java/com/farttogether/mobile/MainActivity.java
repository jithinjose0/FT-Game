package com.farttogether.mobile;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.view.View;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GameOrientationPlugin.class);
        super.onCreate(savedInstanceState);
        getBridge().getWebView().setBackgroundColor(Color.rgb(7,94,89));
        getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        immersiveGame();
        String orientation = getSharedPreferences("game-display", MODE_PRIVATE).getString("orientation", "portrait");
        setRequestedOrientation("landscape".equals(orientation)
            ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            : ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
        // LAN development server access is enabled only in the debug test APK.
        if (BuildConfig.DEBUG) {
            getBridge().getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
    }

    private void immersiveGame() {
        getWindow().getDecorView().setBackgroundColor(Color.rgb(7,94,89));
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immersiveGame();
    }
}
