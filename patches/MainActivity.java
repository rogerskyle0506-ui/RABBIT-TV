package com.rabbittv.app;

import android.os.Bundle;
import android.os.Message;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
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

            // Prevent scripts from automatically opening new windows/popups/redirects via window.open()
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
