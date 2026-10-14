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

            // Use a blacklist approach: allow normal loading, but drop known ad/chrome redirect domains
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    String url = request.getUrl().toString().toLowerCase();

                    // Block explicit external intent schemes and app store handoffs
                    if (url.startsWith("intent://") || url.startsWith("market://") || url.startsWith("vnd.youtube:")) {
                        return true; 
                    }

                    // If a known ad network, tracking domain, or popup-redirect URL is hit, block it
                    if (url.contains("ads.") || url.contains("click") || url.contains("pop") || url.contains("track") || url.contains("serve")) {
                        return true;
                    }

                    // Let everything else load normally so the video stream and player assets aren't choked
                    return false; 
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
