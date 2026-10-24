package com.sipahsalar.game;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

// Full-screen WebView host for the game, which ships inside the APK as assets and runs offline.
public class MainActivity extends Activity {
    private WebView web;
    private long lastBack = 0;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            // draw into the display cutout area (LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES)
            try {
                WindowManager.LayoutParams lp = getWindow().getAttributes();
                lp.getClass().getField("layoutInDisplayCutoutMode").setInt(lp, 1);
                getWindow().setAttributes(lp);
            } catch (Exception ignored) { }
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(12, 17, 14));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        // let the first tap start sounds without an extra gesture (API 17+)
        try { WebSettings.class.getMethod("setMediaPlaybackRequiresUserGesture", boolean.class).invoke(s, false); } catch (Exception ignored) { }
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("file://")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) { }
                return true;
            }
        });
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(web);
        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/index.html");
        immersive();
    }

    private void immersive() {
        // IMMERSIVE_STICKY | FULLSCREEN | HIDE_NAVIGATION | LAYOUT_FULLSCREEN | LAYOUT_HIDE_NAVIGATION | LAYOUT_STABLE
        getWindow().getDecorView().setSystemUiVisibility(0x1000 | 0x4 | 0x2 | 0x400 | 0x200 | 0x100);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immersive();
    }

    @Override
    public void onBackPressed() {
        // first press closes whatever panel is open in the game; a quick second press exits
        long now = System.currentTimeMillis();
        if (now - lastBack < 1800) { super.onBackPressed(); return; }
        lastBack = now;
        web.loadUrl("javascript:window.androidBack&&window.androidBack()");
        Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT).show();
    }

    // save and go quiet first, then freeze JavaScript timers so the game uses no battery in the background
    private boolean paused = false;
    @Override protected void onPause() {
        super.onPause(); paused = true;
        web.loadUrl("javascript:window.androidPause&&window.androidPause()");
        web.postDelayed(new Runnable() { public void run() { if (paused) { web.onPause(); web.pauseTimers(); } } }, 400);
    }
    @Override protected void onResume() { super.onResume(); paused = false; web.onResume(); web.resumeTimers(); immersive(); }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
    @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }
}
