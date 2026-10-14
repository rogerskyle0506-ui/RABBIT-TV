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

            // 1. Checkpoint for location shifts and top-level redirects
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    String url = request.getUrl().toString();

                    // Allow local app content/assets to load normally
                    if (url.startsWith("http://localhost") || url.startsWith("https://localhost") || url.startsWith("capacitor://") || url.startsWith("file://")) {
                        return false; 
                    }

                    // Block external intent schemes and app store/market popups
                    if (url.startsWith("intent://") || url.startsWith("market://") || url.startsWith("vnd.youtube:")) {
                        return true; 
                    }

                    // Allow streaming and embedded player frames (like vidsrc) to function
                    if (url.contains("vidsrc") || url.contains("embed") || url.contains("player")) {
                        return false; 
                    }

                    // Block unexpected external page redirects from hijacking the main view to Chrome
                    return true;
                }
            });

            // 2. Prevent scripts from automatically opening new windows/popups via window.open()
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    // Returning false instantly destroys any attempt to spawn an external window or browser tab
                    return false;
                }
            });
        }
    }
}
