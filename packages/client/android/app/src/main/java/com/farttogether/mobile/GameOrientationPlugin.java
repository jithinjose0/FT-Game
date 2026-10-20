package com.farttogether.mobile;

import android.content.Context;
import android.content.pm.ActivityInfo;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GameOrientation")
public class GameOrientationPlugin extends Plugin {
    @PluginMethod
    public void set(PluginCall call) {
        String orientation = call.getString("orientation");
        if (!"portrait".equals(orientation) && !"landscape".equals(orientation)) {
            call.reject("Choose portrait or landscape.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            getActivity().getSharedPreferences("game-display", Context.MODE_PRIVATE)
                .edit().putString("orientation", orientation).apply();
            getActivity().setRequestedOrientation("landscape".equals(orientation)
                ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                : ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
            call.resolve();
        });
    }
}
