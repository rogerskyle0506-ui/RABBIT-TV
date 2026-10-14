package com.rabbittv.app;

import android.os.Bundle;
import android.os.Message;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep the screen awake safely after super.onCreate
        this.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                getWindow
