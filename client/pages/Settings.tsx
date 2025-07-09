import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Bell,
  Shield,
  Palette,
  Monitor,
  Smartphone,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Volume2,
  MessageSquare,
  Phone,
  Video,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface UserSettings {
  notifications: {
    push: boolean;
    sound: boolean;
    readReceipts: boolean;
    lastSeen: "everyone" | "contacts" | "nobody";
  };
  appearance: {
    darkMode: boolean;
    themeColor: string;
    fontSize: "small" | "medium" | "large";
  };
  privacy: {
    messageEncryption: boolean;
    screenLock: boolean;
    disappearingMessages: boolean;
  };
  chat: {
    mediaAutoDownload: "always" | "wifi" | "never";
    chatBackup: boolean;
    messageSearch: boolean;
  };
  calls: {
    quality: "low" | "medium" | "high";
    backgroundBlur: boolean;
    noiseCancellation: boolean;
  };
}

export default function Settings() {
  const { user, token, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Default settings
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      push: true,
      sound: true,
      readReceipts: true,
      lastSeen: "everyone",
    },
    appearance: {
      darkMode: false,
      themeColor: "primary",
      fontSize: "medium",
    },
    privacy: {
      messageEncryption: true,
      screenLock: false,
      disappearingMessages: false,
    },
    chat: {
      mediaAutoDownload: "wifi",
      chatBackup: false,
      messageSearch: true,
    },
    calls: {
      quality: "high",
      backgroundBlur: true,
      noiseCancellation: true,
    },
  });

  // Fetch user settings
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => usersApi.getMe(),
    enabled: !!token,
  });

  // Update user settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<UserSettings>) =>
      usersApi.updateMe({ settings: newSettings }),
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your settings have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Initialize settings when user data is loaded
  useEffect(() => {
    if (userData?.data?.settings) {
      setSettings({ ...settings, ...userData.data.settings });
    }
  }, [userData]);

  const handleSettingChange = (
    category: keyof UserSettings,
    key: string,
    value: any,
  ) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    };
    setSettings(newSettings);

    // Update backend
    updateSettingsMutation.mutate({
      [category]: {
        [key]: value,
      },
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SettingsSection = ({
    icon: Icon,
    title,
    description,
    children,
  }: {
    icon: any;
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );

  const SettingsItem = ({
    label,
    description,
    children,
    action,
  }: {
    label: string;
    description?: string;
    children?: React.ReactNode;
    action?: () => void;
  }) => (
    <div
      className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2"
      onClick={action}
    >
      <div className="space-y-1">
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children ||
        (action && <ChevronRight className="w-4 h-4 text-muted-foreground" />)}
    </div>
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-full overflow-y-auto p-6 space-y-6">
          <div className="animate-pulse space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-32"></div>
                  <div className="h-4 bg-muted rounded w-48"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-3 bg-muted rounded w-32"></div>
                      </div>
                      <div className="h-6 bg-muted rounded w-12"></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      header={
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>
      }
    >
      <div className="h-full overflow-y-auto p-6 space-y-6">
        {/* Account */}
        <SettingsSection
          icon={User}
          title="Account & Profile"
          description="Manage your personal information and account settings"
        >
          <SettingsItem
            label="Edit Profile"
            description="Update your name, photo, and status"
            action={() => navigate("/profile")}
          />
          <SettingsItem
            label="Privacy Settings"
            description="Control who can see your information"
          />
          <SettingsItem
            label="Blocked Contacts"
            description={`${userData?.data?.blockedUsers?.length || 0} blocked users`}
          />
          <Separator />
          <SettingsItem
            label="Account Security"
            description="Two-factor authentication, password"
          />
          <SettingsItem
            label="Download My Data"
            description="Export your chat history and files"
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          icon={Bell}
          title="Notifications"
          description="Configure how you receive notifications"
        >
          <SettingsItem
            label="Push Notifications"
            description="Receive notifications when the app is closed"
          >
            <Switch
              checked={settings.notifications.push}
              onCheckedChange={(checked) =>
                handleSettingChange("notifications", "push", checked)
              }
            />
          </SettingsItem>
          <SettingsItem
            label="Sound & Vibration"
            description="Play sounds for messages and calls"
          >
            <Switch
              checked={settings.notifications.sound}
              onCheckedChange={(checked) =>
                handleSettingChange("notifications", "sound", checked)
              }
            />
          </SettingsItem>
          <Separator />
          <SettingsItem
            label="Read Receipts"
            description="Let others know when you've read their messages"
          >
            <Switch
              checked={settings.notifications.readReceipts}
              onCheckedChange={(checked) =>
                handleSettingChange("notifications", "readReceipts", checked)
              }
            />
          </SettingsItem>
          <SettingsItem
            label="Last Seen"
            description="Control who can see when you were last online"
          >
            <Badge variant="secondary" className="capitalize">
              {settings.notifications.lastSeen}
            </Badge>
          </SettingsItem>
          <SettingsItem
            label="Do Not Disturb"
            description="Set quiet hours and exceptions"
          />
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection
          icon={Palette}
          title="Appearance"
          description="Customize the look and feel"
        >
          <SettingsItem
            label="Dark Mode"
            description="Switch between light and dark theme"
          >
            <Switch
              checked={settings.appearance.darkMode}
              onCheckedChange={(checked) =>
                handleSettingChange("appearance", "darkMode", checked)
              }
            />
          </SettingsItem>
          <SettingsItem
            label="Theme Color"
            description="Choose your accent color"
          >
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-primary border-2 border-primary-foreground"></div>
              <div className="w-6 h-6 rounded-full bg-blue-500"></div>
              <div className="w-6 h-6 rounded-full bg-green-500"></div>
            </div>
          </SettingsItem>
          <SettingsItem label="Font Size" description="Adjust text size">
            <Badge variant="secondary" className="capitalize">
              {settings.appearance.fontSize}
            </Badge>
          </SettingsItem>
          <SettingsItem
            label="Chat Wallpaper"
            description="Customize chat backgrounds"
          />
        </SettingsSection>

        {/* Privacy & Security */}
        <SettingsSection
          icon={Shield}
          title="Privacy & Security"
          description="Control your privacy and security settings"
        >
          <SettingsItem
            label="Message Encryption"
            description="End-to-end encryption settings"
          >
            <Badge
              variant="secondary"
              className={
                settings.privacy.messageEncryption
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }
            >
              {settings.privacy.messageEncryption ? "Enabled" : "Disabled"}
            </Badge>
          </SettingsItem>
          <SettingsItem
            label="Screen Lock"
            description="Require authentication to open app"
          >
            <Switch
              checked={settings.privacy.screenLock}
              onCheckedChange={(checked) =>
                handleSettingChange("privacy", "screenLock", checked)
              }
            />
          </SettingsItem>
          <SettingsItem
            label="Disappearing Messages"
            description="Auto-delete messages after time"
          >
            <Switch
              checked={settings.privacy.disappearingMessages}
              onCheckedChange={(checked) =>
                handleSettingChange("privacy", "disappearingMessages", checked)
              }
            />
          </SettingsItem>
        </SettingsSection>

        {/* Chat Settings */}
        <SettingsSection
          icon={MessageSquare}
          title="Chat Settings"
          description="Configure chat behavior and features"
        >
          <SettingsItem
            label="Media Auto-Download"
            description="Automatically download photos and videos"
          >
            <Badge variant="secondary" className="capitalize">
              {settings.chat.mediaAutoDownload}
            </Badge>
          </SettingsItem>
          <SettingsItem
            label="Chat Backup"
            description="Backup your conversations to cloud"
          >
            <Switch
              checked={settings.chat.chatBackup}
              onCheckedChange={(checked) =>
                handleSettingChange("chat", "chatBackup", checked)
              }
            />
          </SettingsItem>
          <SettingsItem
            label="Message Search"
            description="Include messages in device search"
          >
            <Switch
              checked={settings.chat.messageSearch}
              onCheckedChange={(checked) =>
                handleSettingChange("chat", "messageSearch", checked)
              }
            />
          </SettingsItem>
        </SettingsSection>

        {/* Calls */}
        <SettingsSection
          icon={Phone}
          title="Calls & Video"
          description="Configure call settings and quality"
        >
          <SettingsItem
            label="Call Quality"
            description="Adjust video and audio quality"
          >
            <Badge variant="secondary" className="capitalize">
              {settings.calls.quality}
            </Badge>
          </SettingsItem>
          <SettingsItem
            label="Background Blur"
            description="Blur background in video calls"
          >
            <Switch
              checked={settings.calls.backgroundBlur}
              onCheckedChange={(checked) =>
                handleSettingChange("calls", "backgroundBlur", checked)
              }
            />
          </SettingsItem>
          <SettingsItem
            label="Noise Cancellation"
            description="Reduce background noise"
          >
            <Switch
              checked={settings.calls.noiseCancellation}
              onCheckedChange={(checked) =>
                handleSettingChange("calls", "noiseCancellation", checked)
              }
            />
          </SettingsItem>
        </SettingsSection>

        {/* Support */}
        <SettingsSection
          icon={HelpCircle}
          title="Help & Support"
          description="Get help and provide feedback"
        >
          <SettingsItem
            label="Help Center"
            description="Browse help articles and tutorials"
          />
          <SettingsItem
            label="Contact Support"
            description="Get help from our support team"
          />
          <SettingsItem
            label="Send Feedback"
            description="Help us improve the app"
          />
          <SettingsItem
            label="Report a Problem"
            description="Report bugs or issues"
          />
          <Separator />
          <SettingsItem label="Terms of Service" />
          <SettingsItem label="Privacy Policy" />
          <SettingsItem label="About" description="Version 1.0.0" />
        </SettingsSection>

        {/* Account Actions */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Button variant="destructive" className="w-full justify-start">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
