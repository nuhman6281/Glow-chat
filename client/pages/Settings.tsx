import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  Settings,
  User,
  Bell,
  Volume2,
  Moon,
  Sun,
  Monitor,
  Shield,
  Palette,
  MessageSquare,
  Phone,
  Video,
  FileText,
  Download,
  Trash2,
  Save,
  X,
  Users,
  Clock,
  Check,
  UserPlus,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useSound } from "@/hooks/use-sound";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { volume, setVolume, isMuted, toggleMute } = useSound();

  // Get current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => usersApi.getMe(),
  });

  const user = userData?.data?.user;

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return usersApi.updateMe(userData);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
    onError: () => {
      toast({
        title: "Failed to update profile",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    email: user?.email || "",
    bio: user?.bio || "",
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    messageNotifications: true,
    callNotifications: true,
    friendRequestNotifications: true,
    groupNotifications: true,
    soundNotifications: true,
    desktopNotifications: true,
    emailNotifications: false,
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: true,
    showLastSeen: true,
    allowFriendRequests: true,
    allowMessagesFromStrangers: false,
    showReadReceipts: true,
    showTypingIndicator: true,
  });

  // Update profile form when user data loads
  if (user && !profileForm.firstName) {
    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      email: user.email || "",
      bio: user.bio || "",
    });
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(profileForm);
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (setting: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handlePrivacyChange = (setting: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: value }));
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="w-4 h-4" />;
      case "dark":
        return <Moon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return "System";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
            <div className="md:col-span-2">
              <div className="h-96 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    name={`${user?.firstName} ${user?.lastName}`}
                    imageUrl={user?.avatar}
                    className="w-20 h-20"
                  />
                  <div>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileForm.firstName}
                      onChange={(e) => handleProfileChange("firstName", e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={(e) => handleProfileChange("lastName", e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileForm.username}
                    onChange={(e) => handleProfileChange("username", e.target.value)}
                    placeholder="Enter your username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => handleProfileChange("bio", e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full min-h-[100px] p-3 border border-input rounded-md bg-background text-foreground resize-none"
                  />
                </div>

                <Button type="submit" disabled={updateUserMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5" />
                    <div>
                      <Label htmlFor="messageNotifications">Message Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you receive new messages
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="messageNotifications"
                    checked={notificationSettings.messageNotifications}
                    onCheckedChange={(checked) => handleNotificationChange("messageNotifications", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <div>
                      <Label htmlFor="callNotifications">Call Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified for incoming calls
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="callNotifications"
                    checked={notificationSettings.callNotifications}
                    onCheckedChange={(checked) => handleNotificationChange("callNotifications", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    <div>
                      <Label htmlFor="friendRequestNotifications">Friend Request Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified for new friend requests
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="friendRequestNotifications"
                    checked={notificationSettings.friendRequestNotifications}
                    onCheckedChange={(checked) => handleNotificationChange("friendRequestNotifications", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <div>
                      <Label htmlFor="groupNotifications">Group Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified for group activities
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="groupNotifications"
                    checked={notificationSettings.groupNotifications}
                    onCheckedChange={(checked) => handleNotificationChange("groupNotifications", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sound Settings</CardTitle>
              <CardDescription>
                Configure notification sounds and volume
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5" />
                  <div>
                    <Label htmlFor="soundNotifications">Sound Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sounds for notifications
                    </p>
                  </div>
                </div>
                <Switch
                  id="soundNotifications"
                  checked={notificationSettings.soundNotifications}
                  onCheckedChange={(checked) => handleNotificationChange("soundNotifications", checked)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Volume</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="h-8 w-8 p-0"
                  >
                    {isMuted ? <X className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>
                <Slider
                  value={[volume]}
                  onValueChange={([value]) => setVolume(value)}
                  max={100}
                  step={1}
                  disabled={isMuted}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0%</span>
                  <span>{volume}%</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your preferred theme
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      onClick={() => setTheme("light")}
                      className="h-20 flex-col gap-2"
                    >
                      <Sun className="w-6 h-6" />
                      <span className="text-sm">Light</span>
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      onClick={() => setTheme("dark")}
                      className="h-20 flex-col gap-2"
                    >
                      <Moon className="w-6 h-6" />
                      <span className="text-sm">Dark</span>
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      onClick={() => setTheme("system")}
                      className="h-20 flex-col gap-2"
                    >
                      <Monitor className="w-6 h-6" />
                      <span className="text-sm">System</span>
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Current Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      {getThemeLabel()} mode is active
                    </p>
                  </div>
                                     <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium border border-input bg-background text-foreground rounded-md">
                     {getThemeIcon()}
                     {getThemeLabel()}
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control your privacy and visibility settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div>
                      <Label htmlFor="showOnlineStatus">Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Let others see when you're online
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="showOnlineStatus"
                    checked={privacySettings.showOnlineStatus}
                    onCheckedChange={(checked) => handlePrivacyChange("showOnlineStatus", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    <div>
                      <Label htmlFor="showLastSeen">Show Last Seen</Label>
                      <p className="text-sm text-muted-foreground">
                        Show when you were last active
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="showLastSeen"
                    checked={privacySettings.showLastSeen}
                    onCheckedChange={(checked) => handlePrivacyChange("showLastSeen", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5" />
                    <div>
                      <Label htmlFor="allowFriendRequests">Allow Friend Requests</Label>
                      <p className="text-sm text-muted-foreground">
                        Let others send you friend requests
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="allowFriendRequests"
                    checked={privacySettings.allowFriendRequests}
                    onCheckedChange={(checked) => handlePrivacyChange("allowFriendRequests", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5" />
                    <div>
                      <Label htmlFor="allowMessagesFromStrangers">Messages from Strangers</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow non-contacts to message you
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="allowMessagesFromStrangers"
                    checked={privacySettings.allowMessagesFromStrangers}
                    onCheckedChange={(checked) => handlePrivacyChange("allowMessagesFromStrangers", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5" />
                    <div>
                      <Label htmlFor="showReadReceipts">Read Receipts</Label>
                      <p className="text-sm text-muted-foreground">
                        Show when you've read messages
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="showReadReceipts"
                    checked={privacySettings.showReadReceipts}
                    onCheckedChange={(checked) => handlePrivacyChange("showReadReceipts", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    <div>
                      <Label htmlFor="showTypingIndicator">Typing Indicator</Label>
                      <p className="text-sm text-muted-foreground">
                        Show when you're typing a message
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="showTypingIndicator"
                    checked={privacySettings.showTypingIndicator}
                    onCheckedChange={(checked) => handlePrivacyChange("showTypingIndicator", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage your account data and privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Export Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Download a copy of your data
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-destructive">Delete Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
