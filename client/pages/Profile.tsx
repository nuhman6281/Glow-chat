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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Briefcase,
  Clock,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");

  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => usersApi.getMe(),
    enabled: !!token,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (userData: any) => usersApi.updateMe(userData),
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors
          .map((err: any) => err.msg)
          .join(", ");
        toast({
          title: "Validation Error",
          description: errorMessages,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to update profile",
          description: error.message || "Please try again",
          variant: "destructive",
        });
      }
    },
  });

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (userData?.data?.user) {
      const user = userData.data.user;
      setName(`${user.firstName} ${user.lastName}`);
      setEmail(user.email);
      setPhoneNumber(user.phoneNumber || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setJobTitle(user.jobTitle || "");
      setDepartment(user.department || "");
    }
  }, [userData]);

  const handleSave = () => {
    const [firstNameRaw, ...lastNameParts] = (name || "").split(" ");
    const firstName = firstNameRaw || "";
    const lastName = lastNameParts.join(" ") || "";

    // Validate required fields
    if (!firstName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name is required",
        variant: "destructive",
      });
      return;
    }

    if (!lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "Last name is required",
        variant: "destructive",
      });
      return;
    }

    // Only include fields that have values (not empty strings)
    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };

    // Only add optional fields if they have values
    if (email && email.trim()) updateData.email = email.trim();
    if (phoneNumber && phoneNumber.trim())
      updateData.phoneNumber = phoneNumber.trim();
    if (bio && bio.trim()) updateData.bio = bio.trim();
    if (location && location.trim()) updateData.location = location.trim();
    if (jobTitle && jobTitle.trim()) updateData.jobTitle = jobTitle.trim();
    if (department && department.trim())
      updateData.department = department.trim();

    updateUserMutation.mutate(updateData);
  };

  const handleCancel = () => {
    // Reset form values to current user data
    if (userData?.data?.user) {
      const user = userData.data.user;
      setName(`${user.firstName} ${user.lastName}`);
      setEmail(user.email);
      setPhoneNumber(user.phoneNumber || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setJobTitle(user.jobTitle || "");
      setDepartment(user.department || "");
    }
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-status-online/10 text-status-online";
      case "away":
        return "bg-yellow-100 text-yellow-700";
      case "offline":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-full overflow-y-auto p-6 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-96" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const currentUser = userData?.data?.user;

  return (
    <AppLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your personal information and preferences
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateUserMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="h-full overflow-y-auto p-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <UserAvatar
                  name={name}
                  status={currentUser?.status || "offline"}
                  className="w-24 h-24"
                />
                {isEditing && (
                  <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="mt-1"
                        rows={3}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold">{name}</h2>
                    <p className="text-muted-foreground mt-1">
                      {jobTitle || "No job title set"}
                    </p>
                    <p className="mt-3 max-w-md">{bio || "No bio available"}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                      <Badge
                        variant="secondary"
                        className={getStatusColor(
                          currentUser?.status || "offline",
                        )}
                      >
                        {currentUser?.status || "Offline"}
                      </Badge>
                      {currentUser?.isEmailVerified && (
                        <Badge variant="outline">Verified</Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Your contact details and communication preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{email}</span>
                    {currentUser?.isEmailVerified && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 text-xs"
                      >
                        Verified
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{phoneNumber || "No phone number set"}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1"
                  placeholder="Enter your location"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{location || "No location set"}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card>
          <CardHeader>
            <CardTitle>Work Information</CardTitle>
            <CardDescription>Your role and team details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                {isEditing ? (
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="mt-1"
                    placeholder="Enter job title"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{jobTitle || "No job title set"}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                {isEditing ? (
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-1"
                    placeholder="Enter department"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span>{department || "No department set"}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Joined{" "}
                  {currentUser?.createdAt
                    ? new Date(currentUser.createdAt).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Last seen{" "}
                  {currentUser?.lastSeen
                    ? new Date(currentUser.lastSeen).toLocaleString()
                    : "Unknown"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Manage your account security and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Verification</p>
                <p className="text-sm text-muted-foreground">
                  Verify your email address for security
                </p>
              </div>
              <Badge
                variant="secondary"
                className={
                  currentUser?.isEmailVerified
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }
              >
                {currentUser?.isEmailVerified ? "Verified" : "Not Verified"}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Profile Visibility</p>
                <p className="text-sm text-muted-foreground">
                  Who can see your profile information
                </p>
              </div>
              <Badge variant="outline">Public</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Activity Status</p>
                <p className="text-sm text-muted-foreground">
                  Show when you're online or active
                </p>
              </div>
              <Badge
                variant="secondary"
                className={getStatusColor(currentUser?.status || "offline")}
              >
                {currentUser?.status || "Offline"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
