namespace Service.Configs
{
    public class EmailSettings
    {
        public string SmtpServer { get; set; }
        public int Port { get; set; } = 587;
        public bool UseSsl { get; set; } = true;
        public string SenderName { get; set; }
        public string SenderEmail { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string FrontendBaseUrl { get; set; }
    }
}

