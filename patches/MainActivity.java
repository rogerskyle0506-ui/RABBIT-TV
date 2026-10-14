package com.rabbittv.app;

import android.os.Bundle;
import android.os.Message;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
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

            // Prevent standard window.open() popups
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    return false;
                }
            });
        }
    }
}
