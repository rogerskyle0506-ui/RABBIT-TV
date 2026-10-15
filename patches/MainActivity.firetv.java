package com.rabbittv.app;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.widget.FrameLayout;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private View customView;
    private FrameLayout fullscreenContainer;
    private WebChromeClient.CustomViewCallback customViewCallback;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep the screen awake during Fire TV streaming sessions
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();

            // Fire OS 7 Silk WebView performance settings
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setSupportZoom(false);

            // Robust Ad/Redirect Blocker tailored for streaming frames on Fire TV
            webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    String url = request.getUrl().toString().toLowerCase();

                    // Block external intent schemes and app store breakouts
                    if (url.startsWith("intent://") || url.startsWith("market://") || url.startsWith("vnd.youtube:")) {
                        return true; 
                    }

                    // Block tracking and ad networks
                    if (url.contains("ads.") || url.contains("click") || url.contains("pop") || url.contains("track") || url.contains("serve")) {
                        return true;
                    }

                    // Allow local app routes and trusted media providers
                    if (url.startsWith("http://localhost") || 
                        url.startsWith("https://localhost") || 
                        url.contains("vidsrc") || 
                        url.contains("tmdb.org")) {
                        return super.shouldOverrideUrlLoading(view, request);
                    }

                    return true;
                }
            });

            // Immersive Fullscreen Video Management for Fire TV
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    return false;
                }

                @Override
                public void onShowCustomView(View view, CustomViewCallback callback) {
                    if (customView != null) {
                        callback.onCustomViewHidden();
                        return;
                    }
                    customView = view;
                    customViewCallback = callback;

                    getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                        View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                        View.SYSTEM_UI_FLAG_FULLSCREEN |
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    );

                    fullscreenContainer = new FrameLayout(MainActivity.this);
                    fullscreenContainer.setBackgroundColor(Color.BLACK);
                    
                    FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT
                    );
                    fullscreenContainer.addView(customView, params);

                    addContentView(fullscreenContainer, new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    ));
                    
                    webView.setVisibility(View.GONE);
                }

                @Override
                public void onHideCustomView() {
                    cleanupCustomView();
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (customView != null) {
            cleanupCustomView();
        } else if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.evaluateJavascript("window.location.pathname", path -> {
                if (path != null && (path.equals("\"/\"") || path.equals("/"))) {
                    return;
                } else {
                    webView.evaluateJavascript("window.history.back()", null);
                }
            });
        } else {
            super.onBackPressed();
        }
    }

    private void cleanupCustomView() {
        if (customView == null) {
            return;
        }
        getWindow().getDecorView().setSystemUiVisibility(0);
        
        if (fullscreenContainer != null && fullscreenContainer.getParent() instanceof ViewGroup) {
            ((ViewGroup) fullscreenContainer.getParent()).removeView(fullscreenContainer);
        }
        
        customView = null;
        fullscreenContainer = null;

        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setVisibility(View.VISIBLE);
        }
        
        if (customViewCallback != null) {
            customViewCallback.onCustomViewHidden();
            customViewCallback = null;
        }
    }
}
