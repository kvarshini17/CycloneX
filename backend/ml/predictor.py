import torch
import torch.nn as nn
import time
import os

class ChannelAttention(nn.Module):
    def __init__(self, channels, reduction=4):
        super().__init__()
        self.fc = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(channels, channels // reduction),
            nn.ReLU(),
            nn.Linear(channels // reduction, channels),
            nn.Sigmoid(),
        )
    def forward(self, x):
        return x * self.fc(x).view(x.size(0), -1, 1, 1)

class ConvBlock(nn.Module):
    def __init__(self, in_c, out_c, stride=1):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_c, out_c, 3, stride=stride, padding=1, bias=False),
            nn.BatchNorm2d(out_c),
            nn.GELU(),
            nn.Conv2d(out_c, out_c, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_c),
        )
        self.skip = nn.Sequential(
            nn.Conv2d(in_c, out_c, 1, stride=stride, bias=False),
            nn.BatchNorm2d(out_c),
        ) if in_c != out_c or stride != 1 else nn.Identity()
        self.act  = nn.GELU()
        self.ca   = ChannelAttention(out_c)

    def forward(self, x):
        return self.act(self.ca(self.conv(x)) + self.skip(x))

class ImageEncoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.stem = nn.Sequential(
            nn.Conv2d(4, 32, 7, stride=2, padding=3, bias=False),
            nn.BatchNorm2d(32), nn.GELU(),
        )
        self.body = nn.Sequential(
            ConvBlock(32,  64, stride=2),
            ConvBlock(64,  128, stride=2),
            ConvBlock(128, 256, stride=2),
            ConvBlock(256, 256),
        )
        self.pool = nn.AdaptiveAvgPool2d(1)

    def forward(self, x):
        return self.pool(self.body(self.stem(x))).flatten(1)

class TrackEncoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(5, 64, num_layers=2, batch_first=True, dropout=0.1, bidirectional=True)
        self.proj = nn.Linear(128, 128)

    def forward(self, x):
        out, _ = self.lstm(x)
        return self.proj(out[:, -1, :])

class CyclonePredictorNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.img_enc   = ImageEncoder()
        self.track_enc = TrackEncoder()
        fuse_dim = 256 + 128

        self.shared = nn.Sequential(
            nn.Linear(fuse_dim, 256), nn.LayerNorm(256), nn.GELU(), nn.Dropout(0.2),
            nn.Linear(256, 128),      nn.LayerNorm(128), nn.GELU(),
        )
        self.head_wind     = nn.Linear(128, 1)
        self.head_pressure = nn.Linear(128, 1)
        self.head_track    = nn.Linear(128, 2)
        self.head_category = nn.Linear(128, 7)

    def forward(self, image, track_seq):
        img_feat   = self.img_enc(image)
        track_feat = self.track_enc(track_seq)
        fused      = torch.cat([img_feat, track_feat], dim=1)
        shared     = self.shared(fused)

        return {
            "wind":     self.head_wind(shared).squeeze(1),
            "pressure": self.head_pressure(shared).squeeze(1),
            "track":    self.head_track(shared),
            "category": self.head_category(shared),
        }

if __name__ == '__main__':
    model_path = os.environ.get('MODEL_PATH', r'D:\CycloneX\best_model.zip')
    
    print(f"[INFO] Loading model from {model_path}...")
    model = CyclonePredictorNet()
    try:
        ckpt = torch.load(model_path, map_location='cpu', weights_only=False)
        if 'model_state' in ckpt:
            model.load_state_dict(ckpt['model_state'])
        else:
            model.load_state_dict(ckpt)
        print("[INFO] Model loaded successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        exit(1)
        
    model.eval()
    
    # Run test
    print("[INFO] Creating mock realistic input tensors (1, 4, 201, 201) and (1, 9, 5)...")
    dummy_image = torch.randn(1, 4, 201, 201)
    dummy_track = torch.tensor([[[12.0 + i*0.2, 85.0 - i*0.1, 50.0 + i*5, 1000 - i*3, 6*i] for i in range(9)]], dtype=torch.float32)

    print("[INFO] Running inference...")
    t0 = time.time()
    with torch.no_grad():
        preds = model(dummy_image, dummy_track)
    t1 = time.time()

    print(f"\n--- INFERENCE RESULT ---")
    print(f"Time Taken: {(t1 - t0)*1000:.2f} ms")
    print(f"Wind Prediction: {preds['wind'].item():.2f}")
    print(f"Pressure Prediction: {preds['pressure'].item():.2f}")
    print(f"Track Delta (Lat/Lon): {preds['track'][0].tolist()}")
    
    cat_probs = torch.softmax(preds['category'], dim=1)
    pred_cat = torch.argmax(cat_probs, dim=1).item()
    print(f"Category Prediction (Class Index): {pred_cat}  (Probs: {[round(p, 4) for p in cat_probs[0].tolist()]})")
