package com.rabbittv.app;

import android.os.Bundle;
import android.os.Message;
import android.view.WindowManager;
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

            // Intercept top-level navigation redirects to stop VidSrc ad clicks from launching Chrome
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    String url = request.getUrl().toString().toLowerCase();

                    // 1. Always allow local app files / bridge traffic so the UI loads normally
                    if (url.startsWith("http://localhost") || url.startsWith("https://localhost") || url.startsWith("capacitor://") || url.startsWith("file://")) {
                        return false; 
                    }

                    // 2. Block explicit external intent schemes and app store popups
                    if (url.startsWith("intent://") || url.startsWith("market://") || url.startsWith("vnd.youtube:")) {
                        return true; 
                    }

                    // 3. Allow the video player, embeds, and streaming stream files to load
                    if (url.contains("vidsrc") || url.contains("embed") || url.contains("player") || url.contains("m3u8") || url.contains("ts") || url.contains("stream")) {
                        return false; 
                    }

                    // 4. Block any other unexpected external URL jump triggered by an ad click from opening Chrome
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
