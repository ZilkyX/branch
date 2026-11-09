"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { CircleUserRoundIcon, EllipsisVerticalIcon, LogOutIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarUserSkeleton() {
  return <Skeleton aria-hidden className="h-12 w-full rounded-lg" />;
}

export function SidebarUser() {
  const { isLoaded, user } = useUser();
  const clerk = useClerk();

  if (!isLoaded || !user) return <SidebarUserSkeleton />;

  const email = user.primaryEmailAddress?.emailAddress ?? "";

  return (
    <SidebarUserView
      name={user.fullName || email || "Your account"}
      email={email}
      imageUrl={user.imageUrl}
      onManage={() => clerk.openUserProfile()}
      onSignOut={() => clerk.signOut({ redirectUrl: "/login" })}
    />
  );
}

export function SidebarUserView({
  name,
  email,
  imageUrl,
  onManage,
  onSignOut,
}: {
  name: string;
  email: string;
  imageUrl: string;
  onManage: () => void;
  onSignOut: () => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />}
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={imageUrl} alt="" />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              {email && <span className="truncate text-xs text-muted-foreground">{email}</span>}
            </div>
            <EllipsisVerticalIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-48"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem
              onClick={() => {
                setOpenMobile(false);
                onManage();
              }}
            >
              <CircleUserRoundIcon />
              Manage account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
