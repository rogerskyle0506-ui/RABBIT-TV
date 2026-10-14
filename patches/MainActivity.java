package com.rabbittv.app;

import android.os.Bundle;
import android.os.Message;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();

            // Configure WebView settings
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Intercept top-level redirects to stop VidSrc from launching Chrome on click
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    String url = request.getUrl().toString();

                    // ALWAYS allow localhost / capacitor local assets to load so the app UI works
                    if (url.startsWith("http://localhost") || url.startsWith("https://localhost") || url.startsWith("capacitor://") || url.startsWith("file://")) {
                        return false; 
                    }

                    // Block intent schemes or external app handlers trying to force Chrome/market
                    if (url.startsWith("intent://") || url.startsWith("market://") || url.startsWith("vnd.youtube:")) {
                        return true; 
                    }

                    // Allow the video streaming source/embed frames to load normally inside the app
                    if (url.contains("vidsrc") || url.contains("embed") || url.contains("player") || url.contains("m3u8") || url.contains("ts")) {
                        return false; 
                    }

                    // For any other unexpected external URL jump triggered by an ad click, block it completely
                    return true; 
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
