package com.rabbittv.app;

import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep the screen awake so phones and projectors don't go idle or trigger screensavers during playback
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();

            // Configure standard WebView settings for smooth streaming and app behavior
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Extend Capacitor's native BridgeWebViewClient to preserve local app routing while blocking ad redirects
            webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    String url = request.getUrl().toString().toLowerCase();

                    // Block explicit external intent schemes and app store popups trying to force Chrome
                    if (url.startsWith("intent://") || url.startsWith("market://") || url.startsWith("vnd.youtube:")) {
                        return true; 
                    }

                    // Block common ad-network tracking/redirect domains trying to hijack the view
                    if (url.contains("ads.") || url.contains("click") || url.contains("pop") || url.contains("track") || url.contains("serve")) {
                        return true;
                    }

                    // Delegate everything else back to Capacitor's bridge so local UI assets load correctly
                    return super.shouldOverrideUrlLoading(view, request);
                }
            });

            // Prevent popups and enable proper Fullscreen video playback expansion
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    return false;
                }

                @Override
                public void onShowCustomView(View view, CustomViewCallback callback) {
                    // If a custom view exists already, stop it
                    if (customView != null) {
                        callback.onCustomViewHidden();
                        return;
                    }
                    customView = view;
                    customViewCallback = callback;
                    // Hide system UI or make video container visible fullscreen
                    getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                        View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                        View.SYSTEM_UI_FLAG_FULLSCREEN |
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    );
                    // Add the custom video view to the activity root
                    addContentView(customView, new WindowManager.LayoutParams(
                        WindowManager.LayoutParams.MATCH_PARENT,
                        WindowManager.LayoutParams.MATCH_PARENT
                    ));
                    webView.setVisibility(View.GONE);
                }

                @Override
                public void onHideCustomView() {
                    if (customView == null) {
                        return;
                    }
                    // Restore original UI visibility and remove custom view
                    getWindow().getDecorView().setSystemUiVisibility(0);
                    ((android.view.ViewGroup) customView.getParent()).removeView(customView);
                    customView = null;
                    webView.setVisibility(View.VISIBLE);
                    if (customViewCallback != null) {
                        customViewCallback.onCustomViewHidden();
                    }
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        // Handle exiting fullscreen via hardware back button if a video is expanded
        if (customView != null) {
            onHideCustomView();
        } else if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            
            // Check the current web route path to handle home screen suppression vs back navigation
            webView.evaluateJavascript("window.location.pathname", path -> {
                if (path != null && (path.equals("\"/\"") || path.equals("/"))) {
                    // On home screen: do nothing (suppress back button exit)
                    return;
                } else {
                    // Not on home screen: navigate back in the app history via JavaScript
                    webView.evaluateJavascript("window.history.back()", null);
                }
            });
        } else {
            super.onBackPressed();
        }
    }

    // Helper method to trigger custom view cleanup from onBackPressed
    public void onHideCustomView() {
        if (customView == null) {
            return;
        }
        getWindow().getDecorView().setSystemUiVisibility(0);
        ((android.view.ViewGroup) customView.getParent()).removeView(customView);
        customView = null;
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setVisibility(View.VISIBLE);
        }
        if (customViewCallback != null) {
            customViewCallback.onCustomViewHidden();
        }
    }
}
